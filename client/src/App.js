import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import './i18n' // I18n import qilish
import Admin from './pages/Admin'
import Home from './pages/Home'
import UserBookings from './pages/UserBookings'

function App() {
	return (
		<Router>
			<div className='App'>
				<Header />
				<main>
					<Routes>
						<Route path='/' element={<Home />} />
						<Route path='/admin' element={<Admin />} />
						<Route path='/my-bookings/:roomNumber' element={<UserBookings />} />
					</Routes>
				</main>
			</div>
		</Router>
	)
}

export default App
