import { useState, useRef, useEffect } from 'react'
import { MapPin, Loader } from 'lucide-react'
import { useGeoSearch } from '../../hooks/useGeoSearch'
import s from './GeoInput.module.css'

export default function GeoInput({ value, onChange, onSelect, placeholder, label }) {
  const [open, setOpen] = useState(false)
  const { results, loading, search, clear } = useGeoSearch()
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleChange(e) {
    onChange(e.target.value)
    search(e.target.value)
    setOpen(true)
  }

  function handleSelect(r) {
    onChange(r.short)
    onSelect?.({ name: r.short, lat: r.lat, lng: r.lng, country: r.country })
    clear()
    setOpen(false)
  }

  return (
    <div className={s.wrap} ref={ref}>
      {label && <label className="field-label">{label}</label>}
      <div className={s.row}>
        <MapPin size={14} className={s.icon}/>
        <input
          className={s.input}
          value={value}
          onChange={handleChange}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder || ''}
        />
        {loading && <Loader size={12} className={s.spin}/>}
      </div>
      {open && results.length > 0 && (
        <ul className={s.dropdown}>
          {results.map(r => (
            <li key={r.id} className={s.opt} onMouseDown={() => handleSelect(r)}>
              <MapPin size={11} style={{ color:'var(--fire)', flexShrink:0 }}/>
              <div>
                <div className={s.optMain}>{r.short}</div>
                <div className={s.optSub}>{r.label?.slice(0, 55)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
