"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LinkIcon } from "lucide-react"
import { OutputDisplay } from "./output-display"

type CrawlMode = "crawl" | "scrape"
type OutputFormat = "markdown" | "html" | "structured" | "all"

interface CrawlOptions {
  url: string
  mode: CrawlMode
  depth: number
  maxPages: number
  outputFormat: OutputFormat
}

interface CrawlResult {
  markdown?: string
  html?: string
  structured?: Record<string, any>
  links?: string[]
}

export default function WebCrawlerUI() {
  const [options, setOptions] = useState<CrawlOptions>({
    url: "",
    mode: "crawl",
    depth: 2,
    maxPages: 10,
    outputFormat: "all",
  })
  const [crawling, setCrawling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<CrawlResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!options.url) return

    setCrawling(true)
    setProgress(0)
    setResults(null)

    try {
      const response = await fetch(`http://localhost:8000/${options.mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedData = ""

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        accumulatedData += decoder.decode(value)
        const lines = accumulatedData.split("\n")
        accumulatedData = lines.pop() || ""

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.progress) {
              setProgress(data.progress)
            }
            if (data.result) {
              setResults(data.result)
            }
          } catch (error) {
            console.error("Error parsing JSON:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setCrawling(false)
    }
  }

  const handleOptionChange = (key: keyof CrawlOptions, value: string | number) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Web Crawler & Scraper</CardTitle>
          <CardDescription className="text-center text-lg">
            Enter a URL to start crawling or scraping and discover content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Input
                type="url"
                placeholder="Enter URL to crawl/scrape"
                value={options.url}
                onChange={(e) => handleOptionChange("url", e.target.value)}
                className="flex-grow"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={options.mode} onValueChange={(value: CrawlMode) => handleOptionChange("mode", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crawl">Crawl</SelectItem>
                    <SelectItem value="scrape">Scrape</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={options.outputFormat}
                  onValueChange={(value: OutputFormat) => handleOptionChange("outputFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select output format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="structured">Structured Data</SelectItem>
                    <SelectItem value="all">All Formats</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Depth"
                  value={options.depth}
                  onChange={(e) => handleOptionChange("depth", Number.parseInt(e.target.value))}
                  min={1}
                  max={10}
                />
                <Input
                  type="number"
                  placeholder="Max Pages"
                  value={options.maxPages}
                  onChange={(e) => handleOptionChange("maxPages", Number.parseInt(e.target.value))}
                  min={1}
                  max={100}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={crawling}>
              {crawling ? "Processing..." : `Start ${options.mode === "crawl" ? "Crawling" : "Scraping"}`}
            </Button>
          </form>
          {crawling && (
            <div className="mt-4 space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-center text-sm text-gray-500">Progress: {Math.round(progress)}%</p>
            </div>
          )}
          {results && (
            <>
              <OutputDisplay markdown={results.markdown} html={results.html} structured={results.structured} />
              {results.links && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-2">Crawled Links</h4>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {results.links.map((link, index) => (
                        <Card key={index} className="flex items-center space-x-2 p-2">
                          <LinkIcon className="w-4 h-4 text-blue-500" />
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm truncate hover:underline"
                          >
                            {link}
                          </a>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-500">
          <p>Built with Next.js and shadcn/ui components. Icons by Lucide.</p>
        </CardFooter>
      </Card>
    </div>
  )
}

