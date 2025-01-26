"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LinkIcon,
  ArrowRight,
  BugIcon as Spider,
  Scissors,
  Bot,
  Layers,
  FileSearch,
  Cpu,
  AlertCircle,
} from "lucide-react"
import { OutputDisplay } from "./output-display"
import { FormatCheckboxes } from "./format-checkboxes"
import { Header } from "./header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Toaster } from "@/components/ui/toaster"

interface CrawlOptions {
  url: string
  max_depth: number
  max_pages: number
  formats: ("html" | "markdown" | "structured_data")[]
}

interface ScrapeOptions {
  url: string
  formats: string[]
}

interface PageData {
  url: string
  markdown?: string
  html?: string
  structured_data?: Record<string, any>
  links?: string[]
}

export default function WebCrawlerUI() {
  const [crawlOptions, setCrawlOptions] = useState<CrawlOptions>({
    url: "",
    max_depth: 3,
    max_pages: 100,
    formats: ["html", "markdown"],
  })
  const [scrapeOptions, setScrapeOptions] = useState<ScrapeOptions>({
    url: "",
    formats: ["markdown"],
  })
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<PageData[]>([])
  const [activeTab, setActiveTab] = useState("crawl")
  const [error, setError] = useState<string | null>(null)

  const handleCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!crawlOptions.url) return
    setError(null)
    setProcessing(true)
    setProgress(0)
    setResults([])

    try {
      const response = await fetch("http://localhost:8000/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(crawlOptions),
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get response reader")
      }

      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        buffer += chunk

        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.progress) {
                setProgress(data.progress)
                console.log("Progress:", data.progress)
              }
              if (data.result) {
                setResults((prev) => {
                  const newResults = [...prev, data.result]
                  console.log("Updated results:", newResults)
                  return newResults
                })
                console.log("Received result:", data.result)
              }
              if (data.error) {
                setError(data.error)
                console.log("Received error:", data.error)
              }
            } catch (error) {
              console.error("Error parsing JSON:", error)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setError("An error occurred while crawling. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const handleScrapeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scrapeOptions.url) return
    setError(null)
    setProcessing(true)
    setProgress(0)
    setResults([])

    try {
      const response = await fetch("http://localhost:8000/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scrapeOptions),
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get response reader")
      }

      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        buffer += chunk

        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.progress) {
                setProgress(data.progress)
                console.log("Progress:", data.progress)
              }
              if (data.result) {
                setResults([data.result])
                console.log("Received result:", data.result)
              }
              if (data.error) {
                setError(data.error)
                console.log("Received error:", data.error)
              }
            } catch (error) {
              console.error("Error parsing JSON:", error)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setError("An error occurred while scraping. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const handleCrawlOptionChange = (key: keyof CrawlOptions, value: any) => {
    if (key === "formats") {
      value = ["html", ...value.filter((format: string) => format !== "html")]
    }
    setCrawlOptions((prev) => ({ ...prev, [key]: value }))
  }

  const handleScrapeOptionChange = (key: keyof ScrapeOptions, value: any) => {
    setScrapeOptions((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="container py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center space-x-2">
              <Bot className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Web Crawler & Scraper For LLM
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Discover, extract, and prepare content for Large Language Models
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="crawl" className="flex items-center space-x-2">
                <Spider className="w-4 h-4" />
                <span>Crawl</span>
              </TabsTrigger>
              <TabsTrigger value="scrape" className="flex items-center space-x-2">
                <Scissors className="w-4 h-4" />
                <span>Scrape</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crawl" className="space-y-6">
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Spider className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Web Crawler</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCrawlSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center space-x-2">
                          <FileSearch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Target URL</span>
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="url"
                            placeholder="https://example.com"
                            value={crawlOptions.url}
                            onChange={(e) => handleCrawlOptionChange("url", e.target.value)}
                            className="flex-grow"
                            required
                          />
                          <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                            {processing ? "Processing..." : "Start Crawling"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>Max Depth</span>
                          </label>
                          <Input
                            type="number"
                            value={crawlOptions.max_depth}
                            onChange={(e) => handleCrawlOptionChange("max_depth", Number.parseInt(e.target.value))}
                            min={1}
                            max={10}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center space-x-2">
                            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>Max Pages</span>
                          </label>
                          <Input
                            type="number"
                            value={crawlOptions.max_pages}
                            onChange={(e) => handleCrawlOptionChange("max_pages", Number.parseInt(e.target.value))}
                            min={1}
                            max={1000}
                          />
                        </div>
                      </div>

                      <FormatCheckboxes
                        selectedFormats={crawlOptions.formats}
                        onFormatChange={(formats) => handleCrawlOptionChange("formats", formats)}
                        isCrawler={true}
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scrape" className="space-y-6">
              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Scissors className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span>Web Scraper</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleScrapeSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center space-x-2">
                          <FileSearch className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span>Target URL</span>
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="url"
                            placeholder="https://example.com"
                            value={scrapeOptions.url}
                            onChange={(e) => handleScrapeOptionChange("url", e.target.value)}
                            className="flex-grow"
                            required
                          />
                          <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700">
                            {processing ? "Processing..." : "Start Scraping"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <FormatCheckboxes
                        selectedFormats={scrapeOptions.formats}
                        onFormatChange={(formats) => handleScrapeOptionChange("formats", formats)}
                        isCrawler={false}
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {processing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Progress: {Math.round(progress)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <>
              <OutputDisplay pages={results} />
              {console.log("Rendering OutputDisplay with results:", results)}
              {results[0].links && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>Crawled Links</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px] w-full rounded-md border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                        {results[0].links.map((link, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                            <LinkIcon className="h-4 w-4 text-blue-500" />
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm truncate hover:underline text-blue-600 dark:text-blue-400"
                            >
                              {link}
                            </a>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <footer className="text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-2">
            <Bot className="w-4 h-4" />
            <span>Get LLM ready data</span>
          </footer>
        </div>
      </main>
      <Toaster />
    </div>
  )
}

