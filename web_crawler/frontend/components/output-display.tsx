"use client"

import { Card, CardContent } from "@/components/ui/card"
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
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Content</h3>
          <Tabs defaultValue="markdown" className="space-y-4">
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
                  <ScrollArea className="h-[400px] w-full rounded-md border">
                    <pre className="p-4 text-sm">{markdown}</pre>
                  </ScrollArea>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => downloadContent(markdown, "output.md")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="html">
              {html && (
                <div className="relative">
                  <ScrollArea className="h-[400px] w-full rounded-md border">
                    <pre className="p-4 text-sm">{html}</pre>
                  </ScrollArea>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => downloadContent(html, "output.html")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="structured">
              {structured && (
                <div className="relative">
                  <ScrollArea className="h-[400px] w-full rounded-md border">
                    <pre className="p-4 text-sm">{JSON.stringify(structured, null, 2)}</pre>
                  </ScrollArea>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => downloadContent(JSON.stringify(structured, null, 2), "output.json")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}

