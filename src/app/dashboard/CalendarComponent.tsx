"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";

interface CalendarProps {
  locale: string;
  upcomingTrainings: Array<{
    title: string;
    date: string;
    trainer: string;
  }>;
}

export function TrainingCalendar({ locale = 'en-US', upcomingTrainings }: CalendarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [trainings, setTrainings] = useState(upcomingTrainings);
  const [value, setValue] = useState(new Date());
  
  // Create locale object for the calendar
  const calendarLocale = {
    locale: locale,
    formatDay: (locale: string | undefined, date: Date) => date.getDate().toString(),
    formatMonthYear: (locale: string | undefined, date: Date) => {
      return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
    },
    formatMonth: (locale: string | undefined, date: Date) => {
      return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
    },
    formatWeekday: (locale: string | undefined, date: Date) => {
      return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
    },
    formatShortWeekday: (locale: string | undefined, date: Date) => {
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
    }
  };

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
      
      return isTrainingDay ? 'bg-blue-100 text-blue-800 font-medium' : null;
    }
    return null;
  };

  // Format the date for display
  const formatTrainingDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Get trainings for the selected date
  const getTrainingsForDate = (date: Date) => {
    return trainings.filter(training => {
      const trainingDate = new Date(training.date);
      return (
        trainingDate.getDate() === date.getDate() &&
        trainingDate.getMonth() === date.getMonth() &&
        trainingDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // Trainings for selected date
  const selectedDateTrainings = getTrainingsForDate(value);

  return (
    <>
      <div className="calendar-container mb-4">
        <style jsx global>{`
          .react-calendar {
            border: none !important;
            width: 100% !important;
            background: transparent !important;
            font-family: inherit !important;
          }
          .react-calendar__navigation {
            margin-bottom: 0.5em !important;
          }
          .react-calendar__navigation button {
            color: #1e40af !important;
            font-weight: 500 !important;
            font-size: 0.875rem !important;
            min-width: 32px !important;
          }
          .react-calendar__month-view__weekdays__weekday {
            font-weight: 500 !important;
            color: #6b7280 !important;
            text-decoration: none !important;
            font-size: 0.75rem !important;
            padding: 0.5em !important;
          }
          .react-calendar__month-view__weekdays__weekday abbr {
            text-decoration: none !important;
            text-transform: uppercase !important;
          }
          .react-calendar__tile {
            padding: 0.5em 0.25em !important;
            font-size: 0.75rem !important;
            height: 2.5rem !important;
          }
          .react-calendar__tile:enabled:hover,
          .react-calendar__tile:enabled:focus {
            background-color: #eff6ff !important;
            color: #1e40af !important;
          }
          .react-calendar__tile--active {
            background-color: #2563eb !important;
            color: white !important;
            font-weight: 500 !important;
          }
          .react-calendar__tile--now {
            background-color: #fef3c7 !important;
            color: #92400e !important;
          }
          .react-calendar__tile--now.react-calendar__tile--active {
            background-color: #2563eb !important;
            color: white !important;
          }
        `}</style>
        
        <Calendar 
          className="text-sm text-gray-700"
          locale={calendarLocale.locale}
          formatDay={calendarLocale.formatDay}
          formatMonth={calendarLocale.formatMonth}
          formatMonthYear={calendarLocale.formatMonthYear}
          formatWeekday={calendarLocale.formatWeekday}
          formatShortWeekday={calendarLocale.formatShortWeekday}
          tileClassName={tileClassName}
          onChange={setValue}
          value={value}
          minDetail="month"
        />
      </div>
      
      <div>
        {selectedDateTrainings.length > 0 ? (
          <div>
            <h3 className="text-xs font-medium text-gray-500 mb-2">
              Trainings on {format(value, 'd MMMM yyyy')}
            </h3>
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {selectedDateTrainings.map((training, index) => (
                <div 
                  key={index} 
                  className="bg-white border-l-4 border-blue-500 pl-2 py-2 pr-3 rounded-sm shadow-sm"
                >
                  <div className="font-medium text-gray-800 text-sm">
                    {training.title}
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs">
                    <span className="text-blue-600">
                      {formatTrainingDate(training.date)}
                    </span>
                    <span className="text-gray-500">
                      {training.trainer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-md p-3 text-center">
            <p className="text-sm text-gray-500">
              No trainings on {format(value, 'd MMMM yyyy')}
            </p>
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
    </>
  );
} 