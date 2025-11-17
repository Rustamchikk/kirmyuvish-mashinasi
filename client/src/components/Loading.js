import { useTranslation } from 'react-i18next'

const Loading = () => {
	const { t } = useTranslation()
	
	return (
		<div className='loading'>
			<div>{t('loading.text')}</div>
		</div>
	)
}

export default Loading