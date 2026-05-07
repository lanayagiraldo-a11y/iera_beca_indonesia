import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DOCUMENT_TYPES } from '../lib/documentTypes'
import DocumentUpload from './DocumentUpload'

export default function DocumentsSection({ candidateId }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('uploaded_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [candidateId])

  const requiredDocs = DOCUMENT_TYPES.filter((d) => d.required)
  const validCount = docs.filter((d) => d.status === 'valid' && requiredDocs.some((r) => r.type === d.type)).length
  const pendingCount = docs.filter((d) => d.status === 'pending').length

  const docByType = {}
  for (const doc of docs) {
    if (!docByType[doc.type]) docByType[doc.type] = doc
  }

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <div>
          <h3 className="font-bold">Documentation</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {validCount} of {requiredDocs.length} required valid
            {pendingCount > 0 && ` · ${pendingCount} pending validation`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-iera-500 transition-all"
              style={{ width: `${(validCount / requiredDocs.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-iera-700">
            {Math.round((validCount / requiredDocs.length) * 100)}%
          </span>
        </div>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-6 text-slate-400 text-sm">Loading documents...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DOCUMENT_TYPES.map((docType) => (
              <DocumentUpload
                key={docType.type}
                candidateId={candidateId}
                docType={docType}
                existingDoc={docByType[docType.type]}
                onChange={load}
              />
            ))}
          </div>
        )}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          💡 Files are stored encrypted in Supabase Storage. Only PDF, JPG or PNG accepted (max 10 MB).
          To pre-select the candidate, the 5 required documents must be marked as <strong>valid</strong>.
        </div>
      </div>
    </div>
  )
}
