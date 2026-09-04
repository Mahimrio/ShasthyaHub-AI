'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface ImageUploaderProps {
  onImageSelect: (file: File) => void
  acceptedTypes?: string
  maxSizeMB?: number
  title?: string
  subtitle?: string
  icon?: React.ReactNode
}

export function ImageUploader({
  onImageSelect,
  acceptedTypes = 'image/*',
  maxSizeMB = 10,
  title,
  subtitle,
  icon,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const { lang } = useLanguage()

  const handleFile = useCallback((file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError(lang === 'bn' ? 'শুধুমাত্র ছবি গ্রহণযোগ্য' : 'Only image files are accepted')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(lang === 'bn' ? `ছবির আকার ${maxSizeMB}MB এর কম হতে হবে` : `Image must be under ${maxSizeMB}MB`)
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    onImageSelect(file)
  }, [maxSizeMB, onImageSelect, lang])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const clear = useCallback(() => {
    setPreview(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }, [])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !preview && inputRef.current?.click()}
      className={cn(
        'relative rounded-3xl transition-all duration-300 overflow-hidden cursor-pointer',
        'glass-card touch-manipulation',
        isDragOver
          ? 'ring-2 ring-sky-500 bg-sky-50/80 dark:bg-sky-950/40 shadow-xl'
          : preview
            ? 'border border-sky-200/60 dark:border-sky-800/40 bg-white/70 dark:bg-gray-900/70 shadow-lg'
            : 'hover:border-sky-300 dark:hover:border-sky-700/80 hover:shadow-xl group'
      )}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Biometric Corner Reticles */}
      <div className="pointer-events-none absolute top-3.5 left-3.5 w-4 h-4 border-t-2 border-l-2 border-sky-500/70 rounded-tl transition-colors group-hover:border-sky-400" />
      <div className="pointer-events-none absolute top-3.5 right-3.5 w-4 h-4 border-t-2 border-r-2 border-sky-500/70 rounded-tr transition-colors group-hover:border-sky-400" />
      <div className="pointer-events-none absolute bottom-3.5 left-3.5 w-4 h-4 border-b-2 border-l-2 border-sky-500/70 rounded-bl transition-colors group-hover:border-sky-400" />
      <div className="pointer-events-none absolute bottom-3.5 right-3.5 w-4 h-4 border-b-2 border-r-2 border-sky-500/70 rounded-br transition-colors group-hover:border-sky-400" />

      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleChange}
        className="hidden"
      />
      <input
        ref={cameraRef}
        type="file"
        accept={acceptedTypes}
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="flex flex-col items-center justify-center p-5 sm:p-7 text-center">
          <div className="relative w-full max-w-sm h-64 sm:h-72 rounded-2xl overflow-hidden shadow-xl ring-2 ring-sky-400/40 bg-black/5 dark:bg-black/30 group/preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            {/* Biometric Viewfinder Reticles & Scanning Beam */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl border border-sky-400/20">
              <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-sky-400" />
              <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-sky-400" />
              <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-sky-400" />
              <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-sky-400" />
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-biometric-scan opacity-70" />
            </div>

            {/* Quick status badge */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white/90 flex items-center gap-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'bn' ? 'স্ক্যান করতে প্রস্তুত' : 'Ready to Screen'}</span>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={(e) => { e.stopPropagation(); clear() }}
              title={lang === 'bn' ? 'ছবি বাতিল করুন' : 'Remove photo'}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 dark:bg-gray-900/80 dark:hover:bg-gray-900 text-white rounded-full p-2 shadow-lg backdrop-blur-md transition-all active:scale-90"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          <p className="mt-3.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
            {lang === 'bn' ? 'চোখের আইরিস ও কর্নিয়া স্পষ্ট রয়েছে' : 'Eye image ready for AI biometric analysis'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[280px] gap-3.5 py-8 px-5">
          {/* Subtle luminous halo behind the upload icon */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-sky-400/20 blur-xl scale-125 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-tr from-sky-500/15 via-cyan-400/20 to-emerald-400/15 border border-sky-300/40 dark:border-sky-500/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              {icon ?? <Upload className="h-7 w-7 text-sky-600 dark:text-sky-400 transition-transform duration-300 group-hover:-translate-y-0.5" />}
            </div>
          </div>

          <div className="text-center px-4 max-w-sm">
            <p className="text-base font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              {title ?? (lang === 'bn' ? 'চোখের স্পষ্ট ছবি আপলোড করুন' : 'Upload High-Quality Eye Photo')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              {subtitle ?? (lang === 'bn'
                ? `ছবি ড্র্যাগ করে আনুন অথবা ক্যামেরা দিয়ে সরাসরি তুলুন (সর্বোচ্চ ${maxSizeMB}MB)`
                : `Drag & drop or snap directly with camera (max ${maxSizeMB}MB)`)}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); cameraRef.current?.click() }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-cyan-500 shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
            >
              <Camera className="h-4 w-4" />
              <span>{lang === 'bn' ? 'ছবি তুলুন' : 'Take Photo'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 glass-pill hover:bg-sky-50 dark:hover:bg-sky-950/40 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
            >
              <Upload className="h-4 w-4" />
              <span>{lang === 'bn' ? 'গ্যালারি' : 'Browse Files'}</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-2.5 bg-red-50/90 dark:bg-red-950/40 border-t border-red-200/60 dark:border-red-800/40 text-center">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}

export function MobileTextInput({ placeholder }: { placeholder: string }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      style={{ fontSize: '16px' }}
      className="w-full min-h-[46px] px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"
    />
  )
}
