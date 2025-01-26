"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Download, Copy, Check, Maximize2, Minimize2, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PageData {
  url: string
  markdown?: string
  html?: string
  structured_data?: Record<string, any>
  links?: string[]
}

interface OutputDisplayProps {
  pages: PageData[]
}

export function OutputDisplay({ pages }: OutputDisplayProps) {
  console.log("OutputDisplay received pages:", pages)
  const { toast } = useToast()
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState(false)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

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

  const copyContent = async (content: string, type: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedStates((prev) => ({ ...prev, [`${currentPageIndex}-${type}`]: true }))
    toast({
      title: "Copied to clipboard",
      description: `The ${type} content has been copied to your clipboard.`,
    })
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [`${currentPageIndex}-${type}`]: false }))
    }, 2000)
  }

  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  const downloadAllPages = (type: "markdown" | "html" | "structured_data") => {
    let content = ""
    pages.forEach((page, index) => {
      content += `Page ${index + 1}: ${page.url}\n\n`
      if (type === "structured_data") {
        content += JSON.stringify(page[type], null, 2)
      } else {
        content += page[type] || ""
      }
      content += "\n\n---\n\n"
    })
    downloadContent(content, `all_pages_${type}.txt`)
  }

  return (
    <Card className={expanded ? "fixed inset-4 z-50 overflow-auto" : ""}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Content</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentPageIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                Page {currentPageIndex + 1} of {pages.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
                disabled={currentPageIndex === pages.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={toggleExpand}>
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span className="ml-2">{expanded ? "Minimize" : "Expand"}</span>
              </Button>
            </div>
          </div>
          <Tabs defaultValue="markdown" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="markdown" disabled={!pages[currentPageIndex]?.markdown}>
                Markdown
              </TabsTrigger>
              <TabsTrigger value="html" disabled={!pages[currentPageIndex]?.html}>
                HTML
              </TabsTrigger>
              <TabsTrigger value="structured" disabled={!pages[currentPageIndex]?.structured_data}>
                Structured Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="markdown">
              {pages[currentPageIndex]?.markdown && (
                <div className="relative">
                  <ScrollArea className={expanded ? "h-[calc(100vh-200px)]" : "h-[400px]"}>
                    <pre className="p-4 text-sm whitespace-pre-wrap">{pages[currentPageIndex].markdown}</pre>
                  </ScrollArea>
                  <div className="absolute top-2 right-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyContent(pages[currentPageIndex].markdown!, "markdown")}
                    >
                      {copiedStates[`${currentPageIndex}-markdown`] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="sr-only">Copy</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadContent(pages[currentPageIndex].markdown!, `page_${currentPageIndex + 1}_markdown.md`)
                      }
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="html">
              {pages[currentPageIndex]?.html && (
                <div className="relative">
                  <ScrollArea className={expanded ? "h-[calc(100vh-200px)]" : "h-[400px]"}>
                    <pre className="p-4 text-sm whitespace-pre-wrap">{pages[currentPageIndex].html}</pre>
                  </ScrollArea>
                  <div className="absolute top-2 right-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyContent(pages[currentPageIndex].html!, "html")}
                    >
                      {copiedStates[`${currentPageIndex}-html`] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="sr-only">Copy</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadContent(pages[currentPageIndex].html!, `page_${currentPageIndex + 1}_html.html`)
                      }
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="structured">
              {pages[currentPageIndex]?.structured_data && (
                <div className="relative">
                  <ScrollArea className={expanded ? "h-[calc(100vh-200px)]" : "h-[400px]"}>
                    <pre className="p-4 text-sm whitespace-pre-wrap">
                      {JSON.stringify(pages[currentPageIndex].structured_data, null, 2)}
                    </pre>
                  </ScrollArea>
                  <div className="absolute top-2 right-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyContent(JSON.stringify(pages[currentPageIndex].structured_data, null, 2), "structured")
                      }
                    >
                      {copiedStates[`${currentPageIndex}-structured`] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="sr-only">Copy</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadContent(
                          JSON.stringify(pages[currentPageIndex].structured_data, null, 2),
                          `page_${currentPageIndex + 1}_structured.json`,
                        )
                      }
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => downloadAllPages("markdown")}>
              Download All Markdown
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadAllPages("html")}>
              Download All HTML
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadAllPages("structured_data")}>
              Download All Structured Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

