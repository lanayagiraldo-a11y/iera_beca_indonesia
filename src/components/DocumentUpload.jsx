import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { STORAGE_BUCKET } from '../lib/documentTypes'

export default function DocumentUpload({ candidateId, docType, existingDoc, onChange }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = async (file) => {
    if (!file) return
    setError(null)

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('Only PDF, JPG or PNG')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File larger than 10 MB')
      return
    }

    setUploading(true)
    try {
      if (existingDoc?.file_url) {
        const oldPath = existingDoc.file_url.split(`${STORAGE_BUCKET}/`)[1]
        if (oldPath) {
          await supabase.storage.from(STORAGE_BUCKET).remove([oldPath])
        }
        await supabase.from('documents').delete().eq('id', existingDoc.id)
      }

      const ext = file.name.split('.').pop()
      const filePath = `${candidateId}/${docType.type}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase.from('documents').insert({
        candidate_id: candidateId,
        type: docType.type,
        file_url: filePath,
        file_name: file.name,
        file_size: file.size,
        status: 'pending'
      })

      if (dbError) throw dbError

      onChange?.()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error uploading')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const openFile = async () => {
    if (!existingDoc?.file_url) return
    const { data, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(existingDoc.file_url, 60 * 5)
    if (urlError) {
      setError('Could not open file')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  const remove = async () => {
    if (!existingDoc) return
    if (!confirm(`Delete ${docType.label}?`)) return
    setUploading(true)
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([existingDoc.file_url])
      await supabase.from('documents').delete().eq('id', existingDoc.id)
      onChange?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const updateStatus = async (newStatus) => {
    if (!existingDoc) return
    await supabase
      .from('documents')
      .update({ status: newStatus, validated_at: newStatus === 'valid' ? new Date().toISOString() : null })
      .eq('id', existingDoc.id)
    onChange?.()
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    valid: 'bg-green-100 text-green-700',
    expired: 'bg-orange-100 text-orange-700',
    rejected: 'bg-red-100 text-red-700'
  }
  const statusLabels = {
    pending: '⏱ Pending',
    valid: '✓ Valid',
    expired: '⚠ Expired',
    rejected: '✗ Rejected'
  }

  if (existingDoc) {
    return (
      <div className="border border-slate-200 rounded-lg p-3 bg-white">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{docType.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-sm font-semibold truncate">{docType.label}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${statusColors[existingDoc.status]}`}>
                {statusLabels[existingDoc.status]}
              </span>
            </div>
            <div className="text-xs text-slate-500 truncate">{existingDoc.file_name}</div>
            <div className="text-[10px] text-slate-400">
              {(existingDoc.file_size / 1024).toFixed(0)} KB · {new Date(existingDoc.uploaded_at).toLocaleDateString('en')}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <button onClick={openFile} className="text-[11px] text-iera-700 hover:text-iera-500 font-semibold">
                👁 View
              </button>
              <span className="text-slate-300">·</span>
              <button onClick={() => fileInputRef.current?.click()} className="text-[11px] text-iera-700 hover:text-iera-500 font-semibold">
                ↻ Replace
              </button>
              {existingDoc.status === 'pending' && (
                <>
                  <span className="text-slate-300">·</span>
                  <button onClick={() => updateStatus('valid')} className="text-[11px] text-green-700 hover:text-green-500 font-semibold">
                    ✓ Validate
                  </button>
                  <span className="text-slate-300">·</span>
                  <button onClick={() => updateStatus('rejected')} className="text-[11px] text-red-700 hover:text-red-500 font-semibold">
                    ✗ Reject
                  </button>
                </>
              )}
              <span className="text-slate-300">·</span>
              <button onClick={remove} className="text-[11px] text-slate-500 hover:text-red-600 font-semibold">
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
      </div>
    )
  }

  return (
    <div
      onClick={() => !uploading && fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      className={`border-2 border-dashed rounded-lg p-3 cursor-pointer transition ${
        dragOver
          ? 'border-iera-500 bg-iera-50'
          : 'border-slate-300 hover:border-iera-500 hover:bg-iera-50/30'
      } ${uploading ? 'opacity-50 cursor-wait' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{docType.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-sm font-semibold">
              {docType.label}
              {docType.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap bg-red-100 text-red-700">
              ✗ Missing
            </span>
          </div>
          <div className="text-xs text-slate-500">{docType.description}</div>
          <div className="text-[11px] text-iera-700 font-semibold mt-2">
            {uploading ? '⏳ Uploading...' : '📤 Click or drag file here'}
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
    </div>
  )
}
