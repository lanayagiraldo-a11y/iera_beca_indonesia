import { useEffect, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

// Renders the actual document file inline so it prints into the PDF.
// Images are embedded directly; PDFs are rasterized page-by-page with pdf.js.
export default function DocFilePreview({ doc, url }) {
  const [pages, setPages] = useState(null)   // rendered PDF pages (data URLs)
  const [status, setStatus] = useState('loading') // loading | ready | error

  const name = (doc.file_name || doc.file_url || '').toLowerCase()
  const isPdf = name.endsWith('.pdf')
  const isImage = /\.(jpe?g|png|webp|gif)$/.test(name)

  useEffect(() => {
    if (!url) return
    if (!isPdf) { setStatus('ready'); return }

    let cancelled = false
    ;(async () => {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise
        const out = []
        const max = Math.min(pdf.numPages, 15)
        for (let i = 1; i <= max; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 2 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
          out.push(canvas.toDataURL('image/jpeg', 0.82))
        }
        if (!cancelled) { setPages(out); setStatus('ready') }
      } catch (e) {
        console.error('PDF render failed', e)
        if (!cancelled) setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [url, isPdf])

  if (!url) {
    return <FileFallback doc={doc} message="File not available" />
  }

  if (isImage) {
    return (
      <img
        src={url}
        alt={doc.file_name || doc.type}
        className="max-w-full max-h-[240mm] mx-auto rounded border border-slate-200"
      />
    )
  }

  if (isPdf) {
    if (status === 'loading') {
      return <div className="text-xs text-slate-400 italic py-4 text-center">Rendering PDF…</div>
    }
    if (status === 'error' || !pages?.length) {
      return <FileFallback doc={doc} url={url} message="Could not render PDF inline" />
    }
    return (
      <div className="space-y-3">
        {pages.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${doc.file_name || doc.type} — page ${i + 1}`}
            className="w-full max-h-[245mm] object-contain rounded border border-slate-200 break-inside-avoid"
          />
        ))}
      </div>
    )
  }

  // Unknown type
  return <FileFallback doc={doc} url={url} message="Preview not available for this file type" />
}

function FileFallback({ doc, url, message }) {
  return (
    <div className="bg-slate-50 border border-dashed border-slate-300 rounded p-3 text-xs text-slate-500">
      <div className="font-semibold text-slate-700">{doc.file_name || doc.type}</div>
      <div className="italic mt-0.5">{message}</div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-iera-700 font-semibold mt-1 inline-block print:hidden">
          ↗ Open file
        </a>
      )}
    </div>
  )
}
