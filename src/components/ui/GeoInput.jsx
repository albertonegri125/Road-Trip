// src/components/ui/GeoInput.jsx
import { useState, useRef, useEffect } from 'react'
import { useGeoSearch } from '../../hooks/useGeoSearch'
import { MapPin, Loader } from 'lucide-react'
import s from './GeoInput.module.css'

export default function GeoInput({ label, placeholder, value, onChange, onSelect }) {
  const [open, setOpen]   = useState(false)
  const [input, setInput] = useState(value || '')
  const { results, loading, search, clear } = useGeoSearch()
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleChange(e) {
    const v = e.target.value
    setInput(v)
    onChange?.(v)
    search(v)
    setOpen(true)
  }

  function handleSelect(item) {
    setInput(item.short)
    onChange?.(item.short)
    onSelect?.(item)
    clear()
    setOpen(false)
  }

  return (
    <div className={s.wrap} ref={ref}>
      {label && <label className={s.label}>{label}</label>}
      <div className={s.inputWrap}>
        <MapPin size={15} className={s.icon} />
        <input
          className={s.input}
          value={input}
          onChange={handleChange}
          onFocus={() => input.length > 1 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && <Loader size={14} className={s.spinner} />}
      </div>
      {open && results.length > 0 && (
        <ul className={s.dropdown}>
          {results.map(r => (
            <li key={r.id} className={s.option} onMouseDown={() => handleSelect(r)}>
              <MapPin size={13} className={s.optIcon} />
              <div>
                <div className={s.optShort}>{r.short}</div>
                <div className={s.optFull}>{r.label}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
