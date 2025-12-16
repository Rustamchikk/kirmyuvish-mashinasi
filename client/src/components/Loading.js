import { useTranslation } from 'react-i18next'
import './Loading.css'

const Loading = () => {
  const { t } = useTranslation()

  return (
    <div className="loading-wrapper">
      <div className="spinner"></div>
      <p className="loading-text">{t('loading.text')}</p>
    </div>
  )
}

export default Loading
