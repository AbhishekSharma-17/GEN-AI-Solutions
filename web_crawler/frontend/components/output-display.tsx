"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Download, Copy, Check, Maximize2, Minimize2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface OutputDisplayProps {
  markdown?: string
  html?: string
  structured?: Record<string, any>
}

export function OutputDisplay({ markdown, html, structured }: OutputDisplayProps) {
  const { toast } = useToast()
  const [copiedStates, setCopiedStates] = useState({
    markdown: false,
    html: false,
    structured: false,
  })
  const [expanded, setExpanded] = useState(false)

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

  const copyContent = async (content: string, type: "markdown" | "html" | "structured") => {
    await navigator.clipboard.writeText(content)
    setCopiedStates((prev) => ({ ...prev, [type]: true }))
    toast({
      title: "Copied to clipboard",
      description: `The ${type} content has been copied to your clipboard.`,
    })
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [type]: false }))
    }, 2000)
  }

  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  return (
    <Card className={expanded ? "fixed inset-4 z-50 overflow-auto" : ""}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Content</h3>
            <Button variant="outline" size="sm" onClick={toggleExpand}>
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="ml-2">{expanded ? "Minimize" : "Expand"}</span>
            </Button>
          </div>
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
                  <ScrollArea className={expanded ? "h-[calc(100vh-200px)]" : "h-[400px]"}>
                    <pre className="p-4 text-sm whitespace-pre-wrap">{markdown}</pre>
                  </ScrollArea>
                  <div className="absolute top-2 right-2 space-x-2">
                    <Button size="sm" variant="outline" onClick={() => copyContent(markdown, "markdown")}>
                      {copiedStates.markdown ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="sr-only">Copy</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadContent(markdown, "output.md")}>
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="html">
              {html && (
                <div className="relative">
                  <ScrollArea className={expanded ? "h-[calc(100vh-200px)]" : "h-[400px]"}>
                    <pre className="p-4 text-sm whitespace-pre-wrap">{html}</pre>
                  </ScrollArea>
                  <div className="absolute top-2 right-2 space-x-2">
                    <Button size="sm" variant="outline" onClick={() => copyContent(html, "html")}>
                      {copiedStates.html ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="sr-only">Copy</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadContent(html, "output.html")}>
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="structured">
              {structured && (
                <div className="relative">
                  <ScrollArea className={expanded ? "h-[calc(100vh-200px)]" : "h-[400px]"}>
                    <pre className="p-4 text-sm whitespace-pre-wrap">{JSON.stringify(structured, null, 2)}</pre>
                  </ScrollArea>
                  <div className="absolute top-2 right-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyContent(JSON.stringify(structured, null, 2), "structured")}
                    >
                      {copiedStates.structured ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="sr-only">Copy</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadContent(JSON.stringify(structured, null, 2), "output.json")}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}

