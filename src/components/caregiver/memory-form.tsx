import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/lib/supabase/auth-context'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { memoryRepository } from '@/lib/repositories/memory'
import { SidebarLayout } from '@/components/caregiver/sidebar-layout'
import { BookOpen, Upload, X, WifiOff } from 'lucide-react'
import { toast } from 'sonner'

interface PatientOption {
  id: string
  name: string
}

interface FormErrors {
  patientId?: string
  name?: string
}

export function MemoryForm() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [patients, setPatients] = useState<PatientOption[]>([])
  const [patientsLoading, setPatientsLoading] = useState(true)

  const [patientId, setPatientId] = useState('')
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  const isOnline = navigator.onLine && isSupabaseConfigured()

  // Fetch linked patients
  useEffect(() => {
    const fetchPatients = async () => {
      setPatientsLoading(true)

      if (isSupabaseConfigured() && user) {
        try {
          const { data: links } = await supabase
            .from('caregiver_patient_links')
            .select('patient_id, patients(id, preferred_language)')
            .eq('caregiver_id', user.id)

          if (links && links.length > 0) {
            const mapped = links.map((link: Record<string, unknown>) => {
              const patient = link.patients as Record<string, unknown> | null
              return {
                id: link.patient_id as string,
                name: patient
                  ? `Patient ${String(patient.id).slice(0, 8)}`
                  : `Patient ${String(link.patient_id).slice(0, 8)}`,
              }
            })
            setPatients(mapped)
          } else {
            setPatients([{ id: user.id, name: 'My Patient' }])
          }
        } catch {
          setPatients([{ id: user.id, name: 'My Patient' }])
        }
      } else {
        setPatients([{ id: 'demo-patient-1', name: 'Demo Patient' }])
      }

      setPatientsLoading(false)
    }

    fetchPatients()
  }, [user])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setPhotoFile(file)

    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!patientId) {
      newErrors.patientId = t('patient_required')
    }
    if (!name.trim()) {
      newErrors.name = t('name_required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return
    setSaving(true)

    try {
      const memoryId = crypto.randomUUID()
      let imageUrl: string | null = null
      let imageStoragePath: string | null = null

      if (photoFile) {
        if (isOnline) {
          try {
            const fileExt = photoFile.name.split('.').pop()
            const filePath = `${patientId}/${memoryId}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
              .from('memory-photos')
              .upload(filePath, photoFile)

            if (uploadError) {
              console.error('Image upload error:', uploadError)
              toast.error('Photo upload failed. Saving without photo.')
            } else {
              const { data: urlData } = supabase.storage
                .from('memory-photos')
                .getPublicUrl(filePath)

              imageUrl = urlData.publicUrl
              imageStoragePath = filePath
            }
          } catch (err) {
            console.error('Storage upload failed:', err)
            toast.error('Photo upload failed. Saving without photo.')
          }
        } else {
          imageUrl = URL.createObjectURL(photoFile)
          imageStoragePath = `pending-upload/${memoryId}`
          toast.info(t('offline_image_disabled'))
        }
      }

      await memoryRepository.create({
        id: memoryId,
        patientId,
        createdBy: user?.id,
        name: name.trim(),
        relationship: relationship.trim() || undefined,
        description: description.trim() || undefined,
        imageUrl: imageUrl ?? undefined,
        imageStoragePath: imageStoragePath ?? undefined,
      })

      if (isOnline) {
        try {
          await supabase.from('memories').upsert(
            {
              id: memoryId,
              patient_id: patientId,
              created_by: user?.id ?? null,
              name: name.trim(),
              relationship: relationship.trim() || null,
              description: description.trim() || null,
              image_url: imageUrl,
              image_storage_path: imageStoragePath,
            } as never,
            { onConflict: 'id' }
          )
        } catch {
          // Already queued for sync
        }
      }

      if (!isOnline) {
        toast.info(t('offline_saved_locally'))
      } else {
        toast.success(t('memory_saved'))
      }

      navigate('/caregiver/dashboard')
    } catch (error) {
      console.error('Failed to save memory:', error)
      toast.error(t('save_failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SidebarLayout>
      <div className="px-8 py-6 max-w-[700px]">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {t('add_memory')}
          </h1>
        </div>

        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Patient Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="patient" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('select_patient')}
                </Label>
                {patientsLoading ? (
                  <div className="flex h-10 items-center rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                    {t('loading')}
                  </div>
                ) : patients.length === 0 ? (
                  <div className="flex h-10 items-center rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground">
                    {t('no_patients_linked')}
                  </div>
                ) : (
                  <Select
                    value={patientId}
                    onValueChange={(val) => {
                      setPatientId(val)
                      if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: undefined }))
                    }}
                  >
                    <SelectTrigger id="patient" aria-label={t('select_patient')} className="h-10 rounded-lg">
                      <SelectValue placeholder={t('select_patient')} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.patientId && (
                  <p className="text-xs text-destructive">{errors.patientId}</p>
                )}
              </div>

              {/* Photo Upload */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('photo')}
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  aria-label={t('photo_upload')}
                />

                {photoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt={t('photo')}
                      className="h-36 w-36 rounded-lg object-cover ring-1 ring-border"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -right-2 -top-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-colors duration-150 hover:bg-destructive/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      aria-label={t('photo_remove')}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors duration-150 hover:border-primary/30 hover:bg-muted/50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                    disabled={!isOnline}
                  >
                    {isOnline ? (
                      <>
                        <Upload className="h-6 w-6" />
                        <span className="text-xs font-medium">{t('photo_upload')}</span>
                        <span className="text-[10px]">JPG, PNG up to 5MB</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-6 w-6" />
                        <span className="text-xs font-medium">{t('offline_image_disabled')}</span>
                      </>
                    )}
                  </button>
                )}

                {!isOnline && !photoPreview && (
                  <p className="text-[10px] text-muted-foreground">
                    <WifiOff className="mr-1 inline h-3 w-3" />
                    {t('offline_image_disabled')}
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('name')}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  placeholder="e.g., Grandma"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className="h-10 rounded-lg"
                />
                {errors.name && (
                  <p id="name-error" className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Relationship */}
              <div className="space-y-1.5">
                <Label htmlFor="relationship" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('relationship')}
                </Label>
                <Input
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g., Grandmother"
                  className="h-10 rounded-lg"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('description')}
                </Label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={t('description_placeholder')}
                />
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full h-10 rounded-lg" disabled={saving}>
                {saving ? t('loading') : t('save')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}
