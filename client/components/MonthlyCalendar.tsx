import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DailyEntry, formatDate } from "@/lib/solarCalculations";

interface MonthlyCalendarProps {
  entries: DailyEntry[];
  initialMonth?: string;
}

export function MonthlyCalendar({ entries, initialMonth }: MonthlyCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    initialMonth
      ? new Date(initialMonth + "-01")
      : new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Create a map of dates to kWh values
  const entryMap = new Map<string, number>();
  entries.forEach((entry) => {
    entryMap.set(entry.date, entry.kWh);
  });

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create array of days for the calendar
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthTotal = entries
    .filter((e) => {
      const eDate = new Date(e.date);
      return eDate.getFullYear() === year && eDate.getMonth() === month;
    })
    .reduce((sum, e) => sum + e.kWh, 0);

  const daysWithData = new Set(
    entries
      .filter((e) => {
        const eDate = new Date(e.date);
        return eDate.getFullYear() === year && eDate.getMonth() === month;
      })
      .map((e) => new Date(e.date).getDate())
  ).size;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>{monthName}</span>
            </CardTitle>
            <CardDescription>Daily energy generation view</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Month Total</p>
            <p className="text-2xl font-bold text-solar-energy">{monthTotal.toFixed(1)} kWh</p>
            <p className="text-xs text-muted-foreground">{daysWithData} days recorded</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm font-semibold text-foreground">{monthName}</span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="aspect-square rounded-lg bg-muted/20"
                  />
                );
              }

              const dateStr = formatDate(new Date(year, month, day));
              const kWh = entryMap.get(dateStr);
              const hasData = kWh !== undefined;

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg p-1 flex flex-col items-center justify-center text-center transition-colors ${
                    hasData
                      ? "bg-gradient-to-br from-solar-sun/20 to-solar-energy/20 border border-solar-energy/50 hover:border-solar-energy"
                      : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <div className="text-xs font-semibold text-foreground">{day}</div>
                  {hasData ? (
                    <div className="text-xs font-bold text-solar-energy">{kWh?.toFixed(1)}</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">—</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-solar-sun/20 to-solar-energy/20 border border-solar-energy/50" />
            <span>Days with data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted/30" />
            <span>No data</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
