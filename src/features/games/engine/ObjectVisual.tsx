/**
 * ObjectVisual — renders a game object with its emoji icon and label.
 * Used across memory rounds and attention challenges.
 */

import {
  Apple,
  Armchair,
  Banana,
  BookOpen,
  BriefcaseBusiness,
  Clock3,
  Coffee,
  Disc,
  Flower2,
  FlaskRound,
  Footprints,
  Gem,
  Glasses,
  GraduationCap,
  KeyRound,
  Lamp,
  Phone,
  Umbrella,
  UtensilsCrossed,
  Volleyball,
} from 'lucide-react'
import type { GameChoice } from '@/features/games/types'

const iconMap: Record<string, typeof Apple> = {
  apple: Apple,
  key: KeyRound,
  cup: Coffee,
  book: BookOpen,
  umbrella: Umbrella,
  flower: Flower2,
  clock: Clock3,
  glasses: Glasses,
  chair: Armchair,
  banana: Banana,
  telephone: Phone,
  bag: BriefcaseBusiness,
  spoon: UtensilsCrossed,
  ball: Volleyball,
  plate: Disc,
  hat: GraduationCap,
  ring: Gem,
  bottle: FlaskRound,
  lamp: Lamp,
  shoe: Footprints,
}

interface ObjectVisualProps {
  item: GameChoice
  compact?: boolean
  showLabel?: boolean
}

export function ObjectVisual({
  item,
  compact = false,
  showLabel = true,
}: ObjectVisualProps) {
  const Icon = iconMap[item.id] ?? Apple
  const size = compact ? 'size-8' : 'size-12'

  return (
    <div className="flex flex-col items-center justify-center">
      <Icon className={size} aria-hidden="true" />
      {showLabel && (
        <span
          className={`mt-2 font-semibold text-foreground ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          {item.label}
        </span>
      )}
    </div>
  )
}
