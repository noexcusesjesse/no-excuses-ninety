import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LAST_MEAL_WINDOW, MEAL_WINDOW_LABEL } from "@/lib/program-position";
import { Clock } from "lucide-react";

/** LoadLine 30 packet: 14:10 meal window. No 24h / 36h UI. */
export function MealWindowCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Meal window
        </CardTitle>
        <CardDescription>
          Habit {MEAL_WINDOW_LABEL}. Last meal {LAST_MEAL_WINDOW}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">{MEAL_WINDOW_LABEL}</p>
        <p className="text-sm text-muted-foreground">
          Eat inside the window. This is not a 24h or 36h fast, and not medical advice.
        </p>
      </CardContent>
    </Card>
  );
}
