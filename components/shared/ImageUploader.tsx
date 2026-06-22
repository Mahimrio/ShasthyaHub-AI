'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface ImageUploaderProps {
  onImageSelect: (file: File) => void
  acceptedTypes?: string
  maxSizeMB?: number
}

export function ImageUploader({ onImageSelect, acceptedTypes = 'image/*', maxSizeMB = 10 }: ImageUploaderProps) {
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
        'relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden',
        isDragOver
          ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30'
          : preview
            ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            : 'border-gray-200 dark:border-gray-700 hover:border-sky-300 dark:hover:border-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-900/20'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Upload preview"
            className="w-full h-72 object-contain bg-gray-50 dark:bg-gray-900"
          />
          <button
            onClick={(e) => { e.stopPropagation(); clear() }}
            className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-60 gap-3">
          <div className="bg-sky-100 dark:bg-sky-900/50 rounded-full p-4">
            <Upload className="h-8 w-8 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload an image'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {lang === 'bn'
                ? `ছবি টেনে আনুন অথবা ক্লিক করুন (সর্বোচ্চ ${maxSizeMB}MB)`
                : `Drag & drop or click to browse (max ${maxSizeMB}MB)`}
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
