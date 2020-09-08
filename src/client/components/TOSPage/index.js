// @flow
import * as React from 'react';
import ReactMd from 'react-md-file';
import mdFile from './privacy.md';
import { Card, Page } from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import './github-markdown.css';
import './styles.scss';

import createApp from '@shopify/app-bridge';
import { Redirect } from '@shopify/app-bridge/actions';

type Props = {
    closePrivacy: () => void,
    acceptedDate: string,
    gotoPage: any,
};

type State = {};

export default class PrivacyContent extends React.Component<Props, State> {

    actionHandle() {
        const {closePrivacy} = this.props;
        closePrivacy();
    }

    componentDidMount() {
        if (document.getElementById("no-root")) {
            document.getElementById("no-root").remove();
        }
    }

    render() {
        const { acceptedDate, gotoPage } = this.props;
        const btnString = acceptedDate ? 'Close' : 'Accept Privacy!';
        /*
        let secondaryActions = gotoPage ? [
            {
                content: 'Fields',
                onAction: () => { gotoPage('home') },
            },
            {
                content: 'Editor',
                onAction: () => { gotoPage('editor') },
            },
            {
                content: 'Support',
                onAction: () => { 
                    gotoPage('support')
                },
            },
            {
                content: 'Documentation',
                onAction: () => { 
                    //gotoPage('document') 
                    
                    let adminRedirect = Redirect.create(createApp({
                        apiKey: window.apiKey,
                        shopOrigin: window.shopOrigin,
                    }));
                    adminRedirect.dispatch(Redirect.Action.REMOTE, {
                        url: 'https://help.advancedcustomfield.com/',
                        newContext: true,    
                    }); 
                },
            },
        ] : [] */
        return (
            <div className="app-privacy">
                {/* <Page>
                    <TitleBar 
                        title="Homepage"
                        secondaryActions={secondaryActions}
                        primaryAction={
                            {
                                content: 'Terms Of Service',
                                disabled: true,
                            }
                        }
                    />
                    <Card 
                        primaryFooterAction={{content: btnString, onAction: () => {this.actionHandle()}}}
                    >
                        <div className="privacy-wrapper markdown-body">
                            <p id="privacy-accepted-date">{acceptedDate}</p>
                            <ReactMd fileName={mdFile} /> 
                        </div>
                    </Card>
                </Page> */}
                <Card 
                    primaryFooterAction={{content: btnString, onAction: () => {this.actionHandle()}}}
                >
                    <div className="privacy-wrapper markdown-body">
                        <p id="privacy-accepted-date">{acceptedDate}</p>
                        <ReactMd fileName={mdFile} /> 
                    </div>
                </Card>
            </div>    
        )
    }
}