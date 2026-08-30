'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface DisclaimerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept: () => void
}

export function DisclaimerModal({ open, onOpenChange, onAccept }: DisclaimerModalProps) {
  const { lang } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </span>
            {lang === 'bn' ? 'সতর্কতা' : 'Medical Disclaimer'}
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            <span className="block">
              {lang === 'bn'
                ? 'এই AI সরঞ্জালটি শুধুমাত্র তথ্যগত উদ্দেশ্যে তৈরি। এটি পেশাদার চিকিৎসকের পরামর্শের বিকল্প নয়।'
                : 'This AI tool is for informational purposes only. It is NOT a substitute for professional medical advice.'}
            </span>
            <span className="block mt-3">
              {lang === 'bn'
                ? 'সঠিক নির্ণয় ও চিকিৎসার জন্য সর্বদা একজন যোগ্য চিকিৎসকের পরামর্শ নিন।'
                : 'Always consult a qualified doctor for proper diagnosis and treatment.'}
            </span>
            <span className="block mt-3 font-medium">
              {lang === 'bn'
                ? 'চালিয়ে যেতে নিচের বাটনে ক্লিক করুন।'
                : 'Click below to proceed.'}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Button onClick={onAccept} className="w-full rounded-xl">
          {lang === 'bn' ? 'আমি বুঝেছি, চালিয়ে যান' : 'I Understand, Continue'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
