"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Card from "@/components/common/card";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface CalendarProps {
  locale: {
    locale: string;
    formatDay: (locale: string | undefined, date: Date) => string;
    formatMonthYear: (locale: string | undefined, date: Date) => string;
    formatMonth: (locale: string | undefined, date: Date) => string;
    formatWeekday: (locale: string | undefined, date: Date) => string;
    formatShortWeekday: (locale: string | undefined, date: Date) => string;
  };
  upcomingTrainings: Array<{
    title: string;
    date: string;
    trainer: string;
  }>;
}

export function TrainingCalendar({ locale, upcomingTrainings }: CalendarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [trainings, setTrainings] = useState(upcomingTrainings);

  // Fetch trainings from database on component mount
  useEffect(() => {
    const fetchTrainings = async () => {
      // If we already have trainings from props, don't fetch again
      if (upcomingTrainings && upcomingTrainings.length > 0) {
        setTrainings(upcomingTrainings);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.upcomingTrainings) {
            setTrainings(data.data.upcomingTrainings);
          }
        }
      } catch (error) {
        console.error("Error fetching trainings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainings();
  }, [upcomingTrainings]);
  
  // Extract training dates for highlighting
  const trainingDates = trainings.map(training => new Date(training.date));
  
  // Function to determine tile class based on date
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      // Check if the date is in our training dates
      const isTrainingDay = trainingDates.some(
        trainingDate => 
          trainingDate.getDate() === date.getDate() &&
          trainingDate.getMonth() === date.getMonth() &&
          trainingDate.getFullYear() === date.getFullYear()
      );
      
      return isTrainingDay ? 'bg-blue-100 text-blue-800 rounded-full font-bold' : null;
    }
    return null;
  };

  // Format the date for display
  const formatTrainingDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-700 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
          Training Calendar
        </h2>
      </div>
      
      <div className="calendar-container">
        <style jsx global>{`
          .react-calendar {
            border: none !important;
            width: 100% !important;
            background: transparent !important;
            font-family: inherit !important;
          }
          .react-calendar__navigation button {
            color: #3b82f6 !important;
            font-weight: bold !important;
            font-size: 1rem !important;
          }
          .react-calendar__month-view__weekdays__weekday {
            font-weight: bold !important;
            color: #4b5563 !important;
            text-decoration: none !important;
          }
          .react-calendar__month-view__weekdays__weekday abbr {
            text-decoration: none !important;
          }
          .react-calendar__tile {
            padding: 0.75em 0.5em !important;
            font-size: 0.875rem !important;
          }
          .react-calendar__tile:enabled:hover,
          .react-calendar__tile:enabled:focus {
            background-color: #dbeafe !important;
            border-radius: 9999px !important;
          }
          .react-calendar__tile--active {
            background-color: #3b82f6 !important;
            color: white !important;
            border-radius: 9999px !important;
          }
          .react-calendar__tile--now {
            background-color: #fef3c7 !important;
            border-radius: 9999px !important;
          }
        `}</style>
        
        <Calendar className="text-sm text-gray-700"
          locale={locale.locale}
          formatDay={locale.formatDay}
          formatMonth={locale.formatMonth}
          formatMonthYear={locale.formatMonthYear}
          formatWeekday={locale.formatWeekday}
          formatShortWeekday={locale.formatShortWeekday}
          tileClassName={tileClassName}
        />
      </div>
      
      <div className="mt-4">
        <h3 className="font-semibold text-gray-700 mb-2 text-sm flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Upcoming Trainings
        </h3>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
          </div>
        ) : trainings.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {trainings.map((training, index) => (
              <div 
                key={index} 
                className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="font-medium text-gray-800 text-sm">
                  {training.title}
                </div>
                <div className="flex justify-between items-center mt-1 text-xs">
                  <span className="text-blue-600 font-medium">
                    {formatTrainingDate(training.date)}
                  </span>
                  <span className="text-gray-500 italic">
                    {training.trainer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            No upcoming trainings scheduled
          </div>
        )}
      </div>
    </Card>
  );
} 