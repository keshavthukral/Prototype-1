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

interface ExitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeave: () => void
}

export function ExitDialog({ open, onOpenChange, onLeave }: ExitDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this activity?</AlertDialogTitle>
          <AlertDialogDescription>
            Your progress in this activity will not be saved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            Continue Activity
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onLeave}
            className="cursor-pointer"
          >
            Leave Activity
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
