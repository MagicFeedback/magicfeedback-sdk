export const endpoints = {
    sdk: {
        app: (appId: string, publicKey: string) => `sdk/app/${appId}/${publicKey}`,
        app_info: (appId: string, publicKey: string) => `sdk/app/${appId}/${publicKey}/info`,
        session: (sessionId: string) => `sdk/app/session/${sessionId}/info`,
        feedback: 'sdk/feedback',
        followUpQuestion: 'sdk/followUpQuestion',
        agentSurveyStart: 'sdk/agentSurvey/start',
        agentSurveyNext: 'sdk/agentSurvey/next',
    }
}
