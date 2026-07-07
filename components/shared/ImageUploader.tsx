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
  }, [])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !preview && inputRef.current?.click()}
      className={cn(
        'relative rounded-2xl border-2 transition-all active:scale-[0.98] duration-100 cursor-pointer overflow-hidden',
        'touch-manipulation',
        isDragOver
          ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30'
          : preview
            ? 'border-sky-100 bg-[#F5F9FC] dark:border-gray-800 dark:bg-gray-900/40'
            : 'border-gray-200 dark:border-gray-700 hover:border-sky-300 dark:hover:border-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-900/20'
      )}
      style={{ touchAction: 'manipulation' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-3 text-sky-500">
            {icon ?? <Camera className="h-10 w-10" />}
          </div>
          <p className="text-base font-bold text-gray-800 dark:text-gray-100">
            {title ?? (lang === 'bn' ? 'ছবি আপলোড করা হয়েছে' : 'Image Uploaded')}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-relaxed">
              {subtitle}
            </p>
          )}
          
          <div className="relative mt-4 border-2 border-emerald-500 rounded-2xl overflow-hidden shadow-md active:scale-[0.99] transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Upload preview"
              className="w-36 h-36 object-cover bg-gray-50 dark:bg-gray-900"
            />
            <button
              onClick={(e) => { e.stopPropagation(); clear() }}
              className="absolute top-1.5 right-1.5 bg-black/60 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1 shadow-sm hover:bg-black/80 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-60 gap-3">
          <div className="bg-sky-100 dark:bg-sky-900/50 rounded-full p-4">
            {icon ?? <Upload className="h-8 w-8 text-sky-600 dark:text-sky-400" />}
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {title ?? (lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload an image')}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {subtitle ?? (lang === 'bn'
                ? `ছবি টেনে আনুন অথবা ক্লিক করুন (সর্বোচ্চ ${maxSizeMB}MB)`
                : `Drag & drop or click to browse (max ${maxSizeMB}MB)`)}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/30 border-t border-red-100 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
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
