// @flow
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
// Root Actions Object
import Actions from '../actions'
// Component to receive STATE/DISPATCH and distribute to child component
import MainContainer from '../components/MainContainer' 
// Function of react-router to distribute router object to app state
import { withRouter } from 'react-router-dom'
// Data type for State and Dispatch
import type { State, Dispatch } from '../types'

// STATE map to app PROP
const mapStateToProps = (state: State) => {
	return { 
		app_data: state.app_data,	
		app_settings: state.app_settings,
		notification: state.notification,
	}
}

// DISPATCH ACTION map to app PROP
const mapDispatchToProps = (dispatch: Dispatch) => {
	return {
		actions: bindActionCreators(Actions, dispatch)
	}
} 

export default withRouter(connect(
	mapStateToProps,
	mapDispatchToProps
)(MainContainer))