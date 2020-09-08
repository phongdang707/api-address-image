// @flow
import * as React from 'react'
// Because Shopify forces to show App Privacy content on first installation
// so that we need to render secont wrap component AppCont layer for easy managing code
import AppCont from '../AppCont'
import axios from 'axios';
import { Loading} from '@shopify/app-bridge-react';
import {Tooltip} from '@shopify/polaris';
import PrivacyContent from "../TOSPage";
import Preloader from "../Preloader";
import createApp from '@shopify/app-bridge';
import { History } from '@shopify/app-bridge/actions';
import { Redirect } from '@shopify/app-bridge/actions';

/**
 * SENTRY DECLARE FOR CATCH APP ERROR 
 */
const APP_AUTH_URL = 'https://arena-wishlist.ngrok.io/shopify/auth?shop=';
let __app;

type Props = {    
    actions: Object,
    history: Object,
    app_data: Object,
    app_settings: Object,
    notification: Object,
};

type State = {  
    showPrivacy: Boolean | null, // inner state of very first container for show privacy content or not
    acceptedDate: String, 
};

function getUrlParameter(name, url) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(url);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function checkStore(app) {
    // Tab Active
    $(window).on('focus.checkStore', () => {
        if(window.checkStore) {
            axios.post(
                `/admin/check-store`,
                {
                    parentUrl: window.parentUrl,
                }
            )
            .then(res => {
                let resObj = res.data;
                if(!resObj.valid) {
                    let adminRedirect = Redirect.create(createApp({
                        apiKey: window.apiKey,
                        shopOrigin: window.parentUrl,
                    }));
                    adminRedirect.dispatch(Redirect.Action.REMOTE, {
                        url: `${APP_AUTH_URL}${window.parentUrl}`,
                        newContext: false,    
                    });
                }
            })
            .catch(err => {})
            .finally(() => {
                window.checkStore = false;   
            })
        }
    });

    // Tab Changed mark need to check store
    $(window).on('blur.checkStore', () => {
        window.checkStore = true;
    });
}

export default class MainContainer extends React.Component<Props, State> {

    // init inner state value
    state = {
        showPrivacy: null,
        acceptedDate: '',
    }

    constructor(props: Props) {
        
        super(props);
        
        // This function only run one when app showed because this is the first root component
        // Suppose this function is the function to query to server to get app status on behalf of client
        __app = this;
        
        // Check valid store url and it's session when change browser tab
        window.parentUrl = getUrlParameter('shop', document.URL);
        window.checkStore = false;
        checkStore(__app);

        // Check only show app when on iframe -- Fix bug mistake session when a machine open multi store to access app
        if(window.parentUrl) {
            if( window.parentUrl === window.shopOrigin ) {
                axios.get(
                    `/admin/app-status`
                )
                .then(response => {
                    const resObj = response.data;
                    if(resObj.status === 'success') {
                        // APP install at first time
                        if(resObj.app_status === 'installed') {
                            this.setState({
                                showPrivacy: true,
                            })
                        }
                        else {
                            let __acceptedDate = '';
                            if(resObj.app_status === 'running' && resObj.install_date) {
                                let localTime = new Date(resObj.install_date).toLocaleString();
                                __acceptedDate = new Date(localTime).toString();
                            }
                            this.setState({
                                showPrivacy: false,
                                acceptedDate: __acceptedDate,
                            })
                        }
                        /** UPDATE SHOP PLAN */
                        if(resObj.store_plan) {
                            props.actions.changeShopPlan(resObj.store_plan)
                        }
    
                        /** UPDATE APP PLAN */
                        // App is new installed - has not app plan yet
                        if(!resObj.app_plan) {
                            let app_plan = '';
                            // App plan is free for developer store
                            if(resObj.shop_plan === "affiliate" || resObj.shop_plan === 'partner_test') {
                                app_plan = 'free'
                            }
                            else {
                                app_plan = 'basic';
                            }
    
                            // Update app plan db
                            axios.post('/admin/app-status', {
                                app_plan,
                            })
                            .then(response => {
                                const resObj = response.data;
                                
                                if(resObj.status == 'success') {
                                    props.actions.changeAppPlan(app_plan);
                                }     
                            })
                            .catch(err => {
                                console.log(err.message);
                            })
                        }
                        // App has been configured plan 
                        else {
                            props.actions.changeAppPlan(resObj.app_plan);
                        }
    
                    } else {
                        throw new Error(resObj.msg);
                    }
                })
                .catch(err => {
                    console.log(err.msg);
                    this.setState({
                        showPrivacy: true,
                    })
                })     
            } else {
                let adminRedirect = Redirect.create(createApp({
                    apiKey: window.apiKey,
                    shopOrigin: window.parentUrl,
                }));
                adminRedirect.dispatch(Redirect.Action.REMOTE, {
                    url: `${APP_AUTH_URL}${window.parentUrl}`,
                    newContext: false,    
                });
            }
        }
    }

    acceptPrivacy() {
        let acceptDateISO = (new Date(Date.now())).toISOString();
        let acceptDate = (new Date(Date.now())).toString();
        // Update app status
        axios.post('/admin/app-status', {
            status: 'running',
            install_date: acceptDateISO,
            uninstall_date: null,
        })
        .then(response => {
            const resObj = response.data;
            
            if(resObj.status == 'success') {
                this.setState({
                    acceptedDate: acceptDate,
                })
            }     
        })
        .catch(err => {
            console.log(err.message);
        })

        this.setState({
            showPrivacy: false,
        })    
    }

    render() {
        const { 
            actions,
            history,
            app_data,
            app_settings,
            notification,
        } = this.props;

        const {
            showPrivacy,
            acceptedDate,    
        } = this.state;

        let appTemplate = null;

        switch(showPrivacy) {
            case null:
                appTemplate = (
                    <div className="app-loading-bar">
                        <Preloader />    
                    </div>    
                );
                break;
            case true:
                appTemplate = (
                    <PrivacyContent acceptedDate={acceptedDate} closePrivacy={this.acceptPrivacy.bind(this)} />
                )
                break;
            case false:
                // Show app content that render in second wrap layer. Send props to it also.
                appTemplate = (
                    <div className="AppContent">
                        <AppCont
                            acceptedDate={acceptedDate}
                            history={history}
                            app_data={app_data} 
                            app_settings={app_settings} 
                            notification={notification}
                            actions={actions}      
                        />
                    </div>
                )
                break;
            default:
                break;
        }

        return (
            <div className="App-Container">
                { appTemplate }
            </div>
        )
    }
}