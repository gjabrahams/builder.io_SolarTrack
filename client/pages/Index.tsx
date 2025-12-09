import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sun, TrendingUp, Calendar, BarChart3, Zap, Plus, Trash2 } from "lucide-react";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import {
  DailyEntry,
  BillingCycle,
  MunicipalRate,
  formatDate,
  getMonthKey,
  getMonthName,
  calculateMonthlyData,
  calculateBillingData,
  calculateSavings,
  parseDate,
} from "@/lib/solarCalculations";

export default function Index() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([]);
  const [dailyDate, setDailyDate] = useState(formatDate(new Date()));
  const [dailyKWh, setDailyKWh] = useState("");
  const [activeTab, setActiveTab] = useState("input");

  // Bulk entry mode state
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState(formatDate(new Date()));
  const [rangeEnd, setRangeEnd] = useState(formatDate(new Date()));
  const [rangeEntries, setRangeEntries] = useState<{ [date: string]: string }>({});

  // Billing cycle form state
  const [billingMonth, setBillingMonth] = useState(formatDate(new Date()).slice(0, 7));
  const [billingStart, setBillingStart] = useState(formatDate(new Date()));
  const [billingEnd, setBillingEnd] = useState(formatDate(new Date()));

  // Municipal rates state
  const [municipalRates, setMunicipalRates] = useState<MunicipalRate[]>([]);
  const [rateTier, setRateTier] = useState("");
  const [rateMaxKWh, setRateMaxKWh] = useState("");
  const [ratePerKWh, setRatePerKWh] = useState("");

  // Load from localStorage
  useEffect(() => {
    const savedEntries = localStorage.getItem("solarEntries");
    const savedCycles = localStorage.getItem("billingCycles");
    const savedRates = localStorage.getItem("municipalRates");

    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedCycles) setBillingCycles(JSON.parse(savedCycles));
    if (savedRates) {
      const rates = JSON.parse(savedRates);
      const normalizedRates = rates.map((r: any) => ({
        id: r.id,
        tier: typeof r.tier === "string" ? parseInt(r.tier) : r.tier,
        maxKWh: typeof r.maxKWh === "string" ? parseFloat(r.maxKWh) : r.maxKWh,
        ratePerKWh: typeof r.ratePerKWh === "string" ? parseFloat(r.ratePerKWh) : r.ratePerKWh,
      }));
      setMunicipalRates(normalizedRates);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("solarEntries", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("billingCycles", JSON.stringify(billingCycles));
  }, [billingCycles]);

  useEffect(() => {
    localStorage.setItem("municipalRates", JSON.stringify(municipalRates));
  }, [municipalRates]);

  const handleAddDailyEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyDate || !dailyKWh || parseFloat(dailyKWh) <= 0) {
      alert("Please enter a valid date and positive kWh value");
      return;
    }

    const newEntry: DailyEntry = {
      date: dailyDate,
      kWh: parseFloat(dailyKWh),
    };

    const existingIndex = entries.findIndex((e) => e.date === dailyDate);
    if (existingIndex >= 0) {
      const updated = [...entries];
      updated[existingIndex] = newEntry;
      setEntries(updated);
    } else {
      setEntries([...entries, newEntry].sort((a, b) => a.date.localeCompare(b.date)));
    }

    setDailyKWh("");
    setDailyDate(formatDate(new Date()));
  };

  const handleDeleteEntry = (date: string) => {
    setEntries(entries.filter((e) => e.date !== date));
  };

  const handleAddBillingCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !billingMonth ||
      !billingStart ||
      !billingEnd ||
      parseDate(billingStart) > parseDate(billingEnd)
    ) {
      alert("Please enter valid dates");
      return;
    }

    const newCycle: BillingCycle = {
      id: `${Date.now()}`,
      month: billingMonth,
      startDate: billingStart,
      endDate: billingEnd,
    };

    setBillingCycles([...billingCycles, newCycle]);
    setBillingMonth(formatDate(new Date()).slice(0, 7));
    setBillingStart(formatDate(new Date()));
    setBillingEnd(formatDate(new Date()));
  };

  const handleDeleteBillingCycle = (id: string) => {
    setBillingCycles(billingCycles.filter((c) => c.id !== id));
  };

  const handleAddMunicipalRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateTier || !rateMaxKWh || !ratePerKWh) {
      alert("Please fill in all rate fields");
      return;
    }

    const tier = parseInt(rateTier);
    const maxKWh = parseFloat(rateMaxKWh);
    const perKWh = parseFloat(ratePerKWh);

    if (tier <= 0 || maxKWh <= 0 || perKWh < 0) {
      alert("Please enter valid positive values");
      return;
    }

    // Check if tier already exists
    if (municipalRates.some((r) => r.tier === tier)) {
      alert("This tier already exists. Please edit the existing tier instead.");
      return;
    }

    const newRate: MunicipalRate = {
      id: `${Date.now()}`,
      tier,
      maxKWh,
      ratePerKWh: perKWh,
    };

    setMunicipalRates([...municipalRates, newRate].sort((a, b) => a.tier - b.tier));
    setRateTier("");
    setRateMaxKWh("");
    setRatePerKWh("");
  };

  const handleDeleteMunicipalRate = (id: string) => {
    setMunicipalRates(municipalRates.filter((r) => r.id !== id));
  };

  const handleEditMunicipalRate = (id: string, updates: Partial<MunicipalRate>) => {
    setMunicipalRates(
      municipalRates.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      )
    );
  };

  const monthlyData = calculateMonthlyData(entries);

  const getDatesBetween = (startStr: string, endStr: string): string[] => {
    const start = parseDate(startStr);
    const end = parseDate(endStr);
    const dates: string[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(formatDate(new Date(d)));
    }

    return dates;
  };

  const handleInitializeRangeMode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeStart || !rangeEnd || parseDate(rangeStart) > parseDate(rangeEnd)) {
      alert("Please enter valid dates with start date before end date");
      return;
    }

    const dates = getDatesBetween(rangeStart, rangeEnd);
    const initialEntries: { [date: string]: string } = {};
    dates.forEach((date) => {
      const existing = entries.find((e) => e.date === date);
      initialEntries[date] = existing ? existing.kWh.toString() : "";
    });

    setRangeEntries(initialEntries);
    setRangeMode(true);
  };

  const handleRangeEntryChange = (date: string, value: string) => {
    setRangeEntries({ ...rangeEntries, [date]: value });
  };

  const handleSubmitRangeEntries = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntries: DailyEntry[] = [];

    Object.entries(rangeEntries).forEach(([date, kWhStr]) => {
      const kWh = parseFloat(kWhStr);
      if (kWh > 0) {
        newEntries.push({ date, kWh });
      }
    });

    if (newEntries.length === 0) {
      alert("Please enter at least one positive kWh value");
      return;
    }

    const merged = [...entries];
    newEntries.forEach((newEntry) => {
      const existingIndex = merged.findIndex((e) => e.date === newEntry.date);
      if (existingIndex >= 0) {
        merged[existingIndex] = newEntry;
      } else {
        merged.push(newEntry);
      }
    });

    merged.sort((a, b) => a.date.localeCompare(b.date));
    setEntries(merged);
    setRangeMode(false);
    setRangeStart(formatDate(new Date()));
    setRangeEnd(formatDate(new Date()));
    setRangeEntries({});
  };

  const handleCancelRangeMode = () => {
    setRangeMode(false);
    setRangeStart(formatDate(new Date()));
    setRangeEnd(formatDate(new Date()));
    setRangeEntries({});
  };

  const rangeDates = rangeMode ? getDatesBetween(rangeStart, rangeEnd) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-solar-sky/10 via-background to-solar-energy/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-solar-sun/20">
                <Sun className="h-6 w-6 text-solar-sun" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">SolarTrack</h1>
                <p className="text-sm text-muted-foreground">Monitor your PV system</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Entries</p>
              <p className="text-2xl font-bold text-solar-energy">{entries.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="input" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Input</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Monthly</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Daily Input Tab */}
          <TabsContent value="input" className="space-y-6">
            {!rangeMode ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-solar-sun" />
                      Single Day Input
                    </CardTitle>
                    <CardDescription>Record your daily solar energy generation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddDailyEntry} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Date</label>
                          <Input
                            type="date"
                            value={dailyDate}
                            onChange={(e) => setDailyDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Energy (kWh)</label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={dailyKWh}
                            onChange={(e) => setDailyKWh(e.target.value)}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="submit"
                            className="w-full gap-2 bg-solar-sun hover:bg-solar-sun/90"
                          >
                            <Plus className="h-4 w-4" />
                            Add Entry
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-solar-sky/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-solar-sky" />
                      Multiple Days Input
                    </CardTitle>
                    <CardDescription>Enter data for a range of dates at once</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInitializeRangeMode} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Start Date</label>
                          <Input
                            type="date"
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Date</label>
                          <Input
                            type="date"
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="submit"
                            className="w-full gap-2 bg-solar-sky hover:bg-solar-sky/90"
                          >
                            <Calendar className="h-4 w-4" />
                            Continue
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-solar-sky" />
                    Enter Daily Values
                  </CardTitle>
                  <CardDescription>
                    {rangeStart} to {rangeEnd} ({rangeDates.length} days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitRangeEntries} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {rangeDates.map((date) => (
                        <div key={date} className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            {new Date(date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="kWh"
                            value={rangeEntries[date] || ""}
                            onChange={(e) => handleRangeEntryChange(date, e.target.value)}
                            className="text-center"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        className="flex-1 gap-2 bg-solar-energy hover:bg-solar-energy/90"
                      >
                        <Plus className="h-4 w-4" />
                        Save All Entries
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelRangeMode}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Recent Entries */}
            {entries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {[...entries].reverse().map((entry) => (
                      <div
                        key={entry.date}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{entry.date}</p>
                          <p className="text-sm text-muted-foreground">{entry.kWh.toFixed(2)} kWh</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.date)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Monthly Analysis Tab */}
          <TabsContent value="monthly" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Generated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-solar-energy">
                    {entries.reduce((sum, e) => sum + e.kWh, 0).toFixed(1)}
                    <span className="text-lg text-muted-foreground"> kWh</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Days Recorded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-solar-sky">{entries.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Daily Average
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">
                    {entries.length > 0
                      ? (entries.reduce((sum, e) => sum + e.kWh, 0) / entries.length).toFixed(2)
                      : "0.00"}
                    <span className="text-lg text-muted-foreground"> kWh</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Months Tracked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-solar-sun">{monthlyData.size}</div>
                </CardContent>
              </Card>
            </div>

            {entries.length > 0 && (
              <MonthlyCalendar entries={entries} initialMonth={Array.from(monthlyData.keys())[0]} />
            )}

            {monthlyData.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(monthlyData.values())
                      .sort((a, b) => b.month.localeCompare(a.month))
                      .map((month) => (
                        <div
                          key={month.month}
                          className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {getMonthName(month.month)}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {month.days} day{month.days !== 1 ? "s" : ""} recorded
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-solar-energy">
                                {month.totalKWh.toFixed(1)} kWh
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {month.avgPerDay.toFixed(2)} kWh/day
                              </p>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-solar-sun to-solar-energy transition-all"
                              style={{
                                width: `${Math.min((month.totalKWh / 100) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Billing Cycles Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-solar-sky" />
                  Set Billing Cycle Dates
                </CardTitle>
                <CardDescription>Define custom date ranges for your billing periods</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBillingCycle} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Month</label>
                      <Input
                        type="month"
                        value={billingMonth}
                        onChange={(e) => setBillingMonth(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={billingStart}
                        onChange={(e) => setBillingStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <Input
                        type="date"
                        value={billingEnd}
                        onChange={(e) => setBillingEnd(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="submit"
                        className="w-full gap-2 bg-solar-sky hover:bg-solar-sky/90"
                      >
                        <Plus className="h-4 w-4" />
                        Add Cycle
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {billingCycles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing Cycles ({billingCycles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {billingCycles.map((cycle) => {
                      const billingData = calculateBillingData(entries, cycle.startDate, cycle.endDate);
                      return (
                        <div
                          key={cycle.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">
                              {getMonthName(cycle.month)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {cycle.startDate} to {cycle.endDate} ({billingData.days} days)
                            </p>
                            <p className="text-lg font-bold text-solar-energy mt-1">
                              {billingData.totalKWh.toFixed(1)} kWh
                              <span className="text-sm text-muted-foreground font-normal ml-2">
                                ({billingData.avgPerDay.toFixed(2)} kWh/day)
                              </span>
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBillingCycle(cycle.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            {billingCycles.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {billingCycles.map((cycle) => {
                  const billingData = calculateBillingData(entries, cycle.startDate, cycle.endDate);
                  return (
                    <Card key={cycle.id} className="border-solar-sky/50">
                      <CardHeader>
                        <CardTitle className="text-lg">{getMonthName(cycle.month)}</CardTitle>
                        <CardDescription>
                          {cycle.startDate} → {cycle.endDate}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Generated</p>
                            <p className="text-2xl font-bold text-solar-energy">
                              {billingData.totalKWh.toFixed(1)}
                            </p>
                            <p className="text-xs text-muted-foreground">kWh</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Daily Average</p>
                            <p className="text-2xl font-bold text-accent">
                              {billingData.avgPerDay.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">kWh/day</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Period Progress</p>
                          <div className="h-3 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-solar-sky to-solar-energy"
                              style={{
                                width: `${Math.min((billingData.totalKWh / 300) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {billingCycles.length === 0 && entries.length > 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">No Billing Cycles Set</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Create billing cycles in the "Billing" tab to see summary data for specific date
                    ranges.
                  </p>
                  <Button
                    onClick={() => setActiveTab("billing")}
                    className="mt-4 gap-2 bg-solar-sky hover:bg-solar-sky/90"
                  >
                    <Calendar className="h-4 w-4" />
                    Set Up Billing Cycles
                  </Button>
                </CardContent>
              </Card>
            )}

            {entries.length === 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">No Data Yet</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Start by adding your daily solar energy readings to see summaries and analytics.
                  </p>
                  <Button
                    onClick={() => setActiveTab("input")}
                    className="mt-4 gap-2 bg-solar-sun hover:bg-solar-sun/90"
                  >
                    <Zap className="h-4 w-4" />
                    Add First Entry
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-solar-sun" />
                  Municipal Electricity Rates
                </CardTitle>
                <CardDescription>
                  Set tiered rates for your municipal electricity grid. Savings are calculated by
                  multiplying your solar generation by these rates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMunicipalRate} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tier Number</label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        value={rateTier}
                        onChange={(e) => setRateTier(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max kWh</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="100"
                        value={rateMaxKWh}
                        onChange={(e) => setRateMaxKWh(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rate per kWh</label>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0.00"
                        value={ratePerKWh}
                        onChange={(e) => setRatePerKWh(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="submit"
                        className="w-full gap-2 bg-solar-sun hover:bg-solar-sun/90"
                      >
                        <Plus className="h-4 w-4" />
                        Add Rate
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {municipalRates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Rate Tiers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {municipalRates.map((rate) => (
                      <div
                        key={rate.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">Tier {rate.tier}</h3>
                          <p className="text-sm text-muted-foreground">
                            Up to {rate.maxKWh} kWh @ ${rate.ratePerKWh.toFixed(3)}/kWh
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMunicipalRate(rate.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {municipalRates.length > 0 && billingCycles.length > 0 && (
              <Card className="border-solar-energy/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-solar-energy" />
                    Estimated Savings by Billing Cycle
                  </CardTitle>
                  <CardDescription>
                    Savings calculated as: Solar Generation (kWh) × Applicable Tier Rate ($/kWh)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {billingCycles.map((cycle) => {
                      const billingData = calculateBillingData(
                        entries,
                        cycle.startDate,
                        cycle.endDate
                      );
                      const savings = calculateSavings(billingData.totalKWh, municipalRates);
                      return (
                        <div
                          key={cycle.id}
                          className="rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {getMonthName(cycle.month)}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {cycle.startDate} to {cycle.endDate}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-solar-energy">
                                ${savings.toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {billingData.totalKWh.toFixed(1)} kWh generated
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm pt-3 border-t border-border">
                            <div>
                              <p className="text-muted-foreground">Total kWh</p>
                              <p className="font-semibold">{billingData.totalKWh.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Avg Rate</p>
                              <p className="font-semibold">
                                ${municipalRates.length > 0 ? (savings / billingData.totalKWh).toFixed(3) : "0.000"}/kWh
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Days</p>
                              <p className="font-semibold">{billingData.days}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {municipalRates.length === 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">No Municipal Rates Set</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Add municipal electricity rates above to calculate your potential savings from
                    solar generation.
                  </p>
                </CardContent>
              </Card>
            )}

            {billingCycles.length === 0 && municipalRates.length > 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">No Billing Cycles Set</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Create billing cycles in the "Billing" tab to see estimated savings for your
                    solar generation.
                  </p>
                  <Button
                    onClick={() => setActiveTab("billing")}
                    className="mt-4 gap-2 bg-solar-sky hover:bg-solar-sky/90"
                  >
                    <Calendar className="h-4 w-4" />
                    Set Up Billing Cycles
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-12">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>SolarTrack • Monitor your PV system offline • All data stored locally</p>
        </div>
      </footer>
    </div>
  );
}
