"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface OutputDisplayProps {
  markdown?: string
  html?: string
  structured?: Record<string, any>
}

export function OutputDisplay({ markdown, html, structured }: OutputDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>("markdown")

  const downloadContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Results</h3>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="markdown" disabled={!markdown}>
            Markdown
          </TabsTrigger>
          <TabsTrigger value="html" disabled={!html}>
            HTML
          </TabsTrigger>
          <TabsTrigger value="structured" disabled={!structured}>
            Structured Data
          </TabsTrigger>
        </TabsList>
        <TabsContent value="markdown">
          {markdown && (
            <div className="relative">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <pre className="whitespace-pre-wrap">{markdown}</pre>
              </ScrollArea>
              <Button
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => downloadContent(markdown, "output.md")}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="html">
          {html && (
            <div className="relative">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <pre className="whitespace-pre-wrap">{html}</pre>
              </ScrollArea>
              <Button size="sm" className="absolute top-2 right-2" onClick={() => downloadContent(html, "output.html")}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="structured">
          {structured && (
            <div className="relative">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <pre className="whitespace-pre-wrap">{JSON.stringify(structured, null, 2)}</pre>
              </ScrollArea>
              <Button
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => downloadContent(JSON.stringify(structured, null, 2), "output.json")}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

