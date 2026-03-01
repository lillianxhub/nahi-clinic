"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Field, FieldLabel } from "@/components/ui/field";

interface DatePickerWithRangeProps {
    className?: string;
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    label?: string;
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
    label = "ช่วงวันที่",
}: DatePickerWithRangeProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Field className="w-full ">
                {/* <FieldLabel className="mb-0.5">
                    <CalendarIcon size={14} className="text-primary/60" />
                    {label}
                </FieldLabel> */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal h-10 bg-card border-gray-200 hover:border-primary/30 transition-colors px-3",
                                !date && "text-foreground",
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "d MMM yyyy", {
                                            locale: th,
                                        })}{" "}
                                        -{" "}
                                        {format(date.to, "d MMM yyyy", {
                                            locale: th,
                                        })}
                                    </>
                                ) : (
                                    format(date.from, "d MMM yyyy", {
                                        locale: th,
                                    })
                                )
                            ) : (
                                <span>เลือกช่วงวันที่</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-100" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                            locale={th}
                        />
                    </PopoverContent>
                </Popover>
            </Field>
        </div>
    );
}
