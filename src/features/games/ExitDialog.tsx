import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useLanguage } from '@/lib/i18n/language-context'

interface ExitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeave: () => void
}

export function ExitDialog({ open, onOpenChange, onLeave }: ExitDialogProps) {
  const { t } = useLanguage()
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('exit_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('exit_description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            {t('keep_playing')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onLeave}
            className="cursor-pointer"
          >
            {t('leave_activity')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
