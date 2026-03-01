"use client";

import * as React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    className?: string;
    label?: string;
}

export function DateTimePicker24hour({
    date,
    setDate,
    className,
}: DateTimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Sync date selection
    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return;

        const newDate = new Date(selectedDate);
        if (date && !isNaN(date.getTime())) {
            newDate.setHours(date.getHours());
            newDate.setMinutes(date.getMinutes());
            newDate.setSeconds(0);
        } else {
            const now = new Date();
            newDate.setHours(now.getHours());
            newDate.setMinutes(now.getMinutes());
            newDate.setSeconds(0);
        }
        setDate(newDate);
        setIsOpen(false);
    };

    // Sync time change from native input
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const timeValue = e.target.value; // "HH:mm"
        if (!timeValue) return;

        const [hours, minutes] = timeValue.split(":").map(Number);
        const baseDate =
            date && !isNaN(date.getTime()) ? new Date(date) : new Date();

        baseDate.setHours(hours);
        baseDate.setMinutes(minutes);
        baseDate.setSeconds(0);

        setDate(baseDate);
    };

    const timeString = React.useMemo(() => {
        if (!date || isNaN(date.getTime())) return "";
        return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    }, [date]);

    return (
        <div className={cn("flex flex-row items-end gap-3", className)}>
            <div className="flex-1 space-y-1.5 text-left">
                {/* <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5 px-0.5">
                    <CalendarIcon size={14} className="text-primary/60" />
                    วันที่
                </label> */}
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-between text-left font-normal h-10 bg-card border-gray-200 hover:border-primary/30 transition-colors",
                                (!date || isNaN(date.getTime())) &&
                                    "text-muted-foreground",
                            )}
                        >
                            <div className="flex items-center">
                                {date && !isNaN(date.getTime()) ? (
                                    format(date, "PPP", { locale: th })
                                ) : (
                                    <span>เลือกวันที่</span>
                                )}
                            </div>
                            <CalendarIcon className="h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={
                                date && !isNaN(date.getTime())
                                    ? date
                                    : undefined
                            }
                            onSelect={handleDateSelect}
                            initialFocus
                            locale={th}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="w-35 space-y-1.5 text-left">
                {/* <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5 px-0.5">
                    <Clock size={14} className="text-primary/60" />
                    เวลา
                </label> */}
                <div className="relative">
                    <Input
                        type="time"
                        value={timeString}
                        onChange={handleTimeChange}
                        className="h-10 bg-white border-gray-200 focus:ring-primary/20 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer pl-3 pr-10"
                    />
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
