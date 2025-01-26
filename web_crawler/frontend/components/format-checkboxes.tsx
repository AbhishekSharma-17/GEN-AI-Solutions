"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { BookMarkedIcon as Markdown, FileCode, Database } from "lucide-react"

const formats = [
  {
    id: "html",
    label: "HTML",
    icon: FileCode,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "markdown",
    label: "Markdown",
    icon: Markdown,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "structured_data",
    label: "Structured Data",
    icon: Database,
    color: "text-green-600 dark:text-green-400",
  },
]

interface FormatCheckboxesProps {
  selectedFormats: string[]
  onFormatChange: (formats: string[]) => void
  isCrawler: boolean
}

export function FormatCheckboxes({ selectedFormats, onFormatChange, isCrawler }: FormatCheckboxesProps) {
  const handleCheckboxChange = (formatId: string, checked: boolean) => {
    if (checked) {
      onFormatChange([...selectedFormats, formatId])
    } else {
      onFormatChange(selectedFormats.filter((f) => f !== formatId && (!isCrawler || f !== "html")))
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center space-x-2">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Output Formats</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
          {formats.map((format) => (
            <div key={format.id} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <Checkbox
                id={format.id}
                checked={selectedFormats.includes(format.id)}
                onCheckedChange={(checked) => handleCheckboxChange(format.id, checked as boolean)}
                disabled={isCrawler && format.id === "html"}
              />
              <label
                htmlFor={format.id}
                className={`text-sm font-medium leading-none flex items-center space-x-2 ${
                  isCrawler && format.id === "html" ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
              >
                <format.icon className={`w-4 h-4 ${format.color}`} />
                <span>{format.label}</span>
                {isCrawler && format.id === "html" && <span className="text-xs text-gray-500">(Mandatory)</span>}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

