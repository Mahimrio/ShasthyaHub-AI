'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Download, Loader2 } from 'lucide-react'

interface PDFDownloadButtonProps {
  type: 'eye' | 'prescription' | 'food'
  analysisId: string
}

export function PDFDownloadButton({ type, analysisId }: PDFDownloadButtonProps) {
  const { lang } = useLanguage()
  const [downloading, setDownloading] = useState(false)

  const handleGeneratePDF = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/reports/detail?id=${analysisId}&type=${type}`)
      if (!res.ok) throw new Error('Failed to fetch report')
      const { data: report } = await res.json()

      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '-9999px'
      container.style.width = '790px'
      container.style.padding = '40px'
      container.style.backgroundColor = '#FFFFFF'
      container.style.color = '#111111'
      container.style.fontFamily = 'sans-serif'

      const analysisType = type === 'eye' ? 'Nayan AI - Eye Analysis'
        : type === 'prescription' ? 'ScriptGuard - Prescription Analysis'
        : 'GlycoVision - Food Analysis'

      const summary = type === 'eye'
        ? (report?.diagnosis || '')
        : type === 'prescription'
          ? `${report?.extracted_drugs?.length || 0} drug(s) detected. ${report?.has_dangerous_interactions ? '⚠️ Dangerous interactions found.' : '✓ No dangerous interactions.'}`
          : (lang === 'bn' ? report?.risk_summary_bn : report?.risk_summary_en) || ''

      container.innerHTML = `
        <div style="border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 24px;">
          <h1 style="font-size: 26px; color: #2563EB; margin: 0;">ShasthyaHub-AI</h1>
          <p style="font-size: 12px; color: #6B7280; margin: 4px 0 0 0;">${analysisType}</p>
          <p style="font-size: 10px; color: #9CA3AF; margin: 2px 0 0 0;">ID: ${analysisId}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; margin-bottom: 8px; color: #374151;">Assessment Parameters</h3>
          <p style="font-size: 14px; margin: 4px 0;"><strong>Category:</strong> ${type.toUpperCase()}</p>
          <p style="font-size: 14px; margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px; margin-bottom: 40px;">
          <h3 style="font-size: 16px; margin-top: 0; color: #111111;">AI Diagnostics Summary</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #374151;">${summary}</p>
        </div>
        <div style="border-top: 1px solid #E5E7EB; padding-top: 12px; text-align: center;">
          <p style="font-size: 10px; color: #9CA3AF; line-height: 1.4; margin: 0;">
            This document is an automated computer-generated analysis result compiled via an AI screening mechanism.
            It does not constitute a valid clinical diagnosis or substitute professional medical advice.
            Please share with a certified medical doctor.
          </p>
        </div>
      `

      document.body.appendChild(container)

      const canvas = await html2canvas(container, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      document.body.removeChild(container)

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= 297
      }

      pdf.save(`shasthyahub-${type}-${analysisId.slice(0, 8)}.pdf`)
    } catch (err) {
      console.error('[PDF] generation failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleGeneratePDF}
      disabled={downloading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors disabled:opacity-50"
    >
      {downloading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span>{lang === 'bn' ? 'PDF ডাউনলোড' : 'Download PDF'}</span>
    </button>
  )
}
