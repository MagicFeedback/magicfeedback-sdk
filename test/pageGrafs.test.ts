import {beforeEach, describe, expect, test} from "@jest/globals";
import {PageGraph} from "../src/models/pageGrafs";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";
import {Page} from "../src/models/page";
import {ConditionType, OperatorType, PageRoute, TransitionType} from "../src/models/pageRoute";


describe('pageGrafs', () => {
    let graph: PageGraph = new PageGraph([]);

    const defaultQuestions = (position: number, followUp: boolean): NativeQuestion => {
        return <NativeQuestion>{
            id: position.toString(),
            title: `Question ${position}`,
            type: 'TEXT',
            questionType: {conf: {}},
            ref: position.toString(),
            require: true,
            external_id: position.toString(),
            value: [''],
            defaultValue: '',
            appId: '1',
            followup: followUp,
            position: position,
            assets: {}
        }
    }

    const setGraph = (questions: NativeQuestion[]) => {
        const pages: Page[] = [
            ...questions.map((q, index) =>
                new Page(index.toString(), index, 'integration', [q], questions[index + 1] ? [
                    new PageRoute(index.toString(), q.ref, OperatorType.NOEQUAL, [''], TransitionType.PAGE, (index + 1).toString(), 'test'),
                ] : []))
        ];

        graph = new PageGraph(pages);
    }

    const setGraphWithRoutes = (pages: Page[]) => {
        graph = new PageGraph(pages);
    }

    beforeEach(() => {

    });

    describe('findMaxDepth', () => {
        test('No follow up => total: 5', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false),
                defaultQuestions(4, false),
                defaultQuestions(5, false)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(5);
        });

        test('Followup only (F) => total: 2', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, true)
            ];

            setGraph(questions)

            expect(graph.findMaxDepth()).toBe(1);
        });
    });

    describe('findMaxDeepWithConditions', () => {

        test('Test a simple tree without followups and conditions', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false),
                defaultQuestions(4, false),
                defaultQuestions(5, false),
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], [
                    new PageRoute('1', '1', OperatorType.EQUAL, ['A'], TransitionType.PAGE, '2', '1', ConditionType.LOGICAL),
                    new PageRoute('2', '1', OperatorType.EQUAL, ['B'], TransitionType.PAGE, '3', '1', ConditionType.LOGICAL),
                    new PageRoute('3', '1', OperatorType.EQUAL, ['C'], TransitionType.PAGE, '4', '1', ConditionType.LOGICAL),
                ]),
                new Page('2', 2, 'integration', [questions[1]], [
                    // Finish
                    new PageRoute('1', '2', OperatorType.DEFAULT, [''], TransitionType.FINISH, '', '2', ConditionType.DIRECT),
                ]),
                new Page('3', 3, 'integration', [questions[2]], [
                    // Go to 5
                    new PageRoute('1', '3', OperatorType.DEFAULT, [''], TransitionType.PAGE, '5', '3', ConditionType.DIRECT),
                ]),
                new Page('4', 4, 'integration', [questions[3]], []),
                new Page('5', 5, 'integration', [questions[4]], []),
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(3);
        });

        test('Test a simple tree with followups and conditions', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false),
                defaultQuestions(4, false),
                defaultQuestions(5, false),
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], [
                    new PageRoute('1', '1', OperatorType.EQUAL, ['A'], TransitionType.PAGE, '2', '1', ConditionType.LOGICAL),
                    new PageRoute('2', '1', OperatorType.EQUAL, ['B'], TransitionType.PAGE, '3', '1', ConditionType.LOGICAL),
                    new PageRoute('3', '1', OperatorType.EQUAL, ['C'], TransitionType.PAGE, '4', '1', ConditionType.LOGICAL),
                ]),
                new Page('2', 2, 'integration', [questions[1]], [
                    // Finish
                    new PageRoute('1', '2', OperatorType.DEFAULT, [''], TransitionType.FINISH, '', '2', ConditionType.DIRECT),
                ]),
                new Page('3', 3, 'integration', [questions[2]], [
                    // Finish
                    new PageRoute('1', '3', OperatorType.DEFAULT, [''], TransitionType.FINISH, '', '3', ConditionType.DIRECT),
                ]),
                new Page('4', 4, 'integration', [questions[3]], [
                    // Finish
                    new PageRoute('1', '4', OperatorType.DEFAULT, [''], TransitionType.FINISH, '', '4', ConditionType.DIRECT),
                ]),
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(2);
        });

        test('Test a simple tree with end route and conditions', async () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false)
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], [
                    new PageRoute('1', '1', OperatorType.EQUAL, ['Yes'], TransitionType.PAGE, '2', '1', ConditionType.LOGICAL),
                    new PageRoute('2', '1', OperatorType.EQUAL, ['No'], TransitionType.FINISH, '', '1'),
                ]),
                new Page('2', 2, 'integration', [questions[1]], [
                    new PageRoute('1', '2', OperatorType.EQUAL, ['Yes'], TransitionType.PAGE, '3', '2'),
                    new PageRoute('2', '2', OperatorType.EQUAL, ['No'], TransitionType.FINISH, '', '2'),
                ]),
                new Page('3', 3, 'integration', [questions[2]], []),
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(3);
        });


        test('Test simple line with conditional routes', () => {
            const questions: NativeQuestion[] = [
                defaultQuestions(1, false),
                defaultQuestions(2, false),
                defaultQuestions(3, false),
                defaultQuestions(4, false),
                defaultQuestions(5, false),
            ];

            const pages: Page[] = [
                new Page('1', 1, 'integration', [questions[0]], [
                    // If is not 2 finsih
                    new PageRoute('1', '1', OperatorType.EQUAL, ['2'], TransitionType.FINISH, '', ConditionType.LOGICAL),
                ]),
                new Page('2', 2, 'integration', [questions[1]], []),
                new Page('3', 3, 'integration', [questions[2]], []),
                new Page('4', 4, 'integration', [questions[3]], []),
                new Page('5', 5, 'integration', [questions[4]], []),
            ];

            setGraphWithRoutes(pages)

            expect(graph.findMaxDepth()).toBe(5);
        })

        test('Dawn CPO AI summit feedback form depth => 11', () => {
            const integrationId = 'a6931b70-b646-11f0-b9c6-0becd5ece65f';
            const qName: NativeQuestion = {
                id: '3e1f71d0-be73-11f0-a130-4b60f8068e07',
                title: 'Your name (optional)',
                ref: 'q--6jyci',
                refMetric: '',
                require: false,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 1,
                followup: false,
                assets: {},
                integrationId,
                integrationPageId: '3dc59200-be73-11f0-a130-4b60f8068e07',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qRecommend: NativeQuestion = {
                id: 'cbd64ab0-b646-11f0-b9c6-0becd5ece65f',
                title: 'How likely are you to recommend one of our summits to a friend or colleague?',
                ref: 'howlikelyareyoutorecommendoneofoursummitstoafriendorcolleague',
                refMetric: 'recommend friend',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 2,
                followup: false,
                assets: {min:'1',max:'10'},
                integrationId,
                integrationPageId: 'cbc7a4b0-b646-11f0-b9c6-0becd5ece65f',
                type: FEEDBACKAPPANSWERTYPE.RATING_NUMBER,
                questionType: {conf: null}
            };
            const qLowFollowup: NativeQuestion = {
                id: 'cc6a5a00-be6d-11f0-b7ae-abe773b9b486',
                title: 'What should we change for you to give a higher rating?',
                ref: 'q--qm3l1s',
                refMetric: '',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 3,
                followup: true,
                assets: {},
                integrationId,
                integrationPageId: 'cbf35540-be6d-11f0-b7ae-abe773b9b486',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qMidFollowup: NativeQuestion = {
                id: 'db50e570-be6d-11f0-b7ae-abe773b9b486',
                title: 'Is there anything we could have done differently to increase your satisfaction?',
                ref: 'q--b8v8tm',
                refMetric: '',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 4,
                followup: true,
                assets: {},
                integrationId,
                integrationPageId: 'db412e00-be6d-11f0-b7ae-abe773b9b486',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qHighFollowup: NativeQuestion = {
                id: 'e30b32c0-be6d-11f0-b7ae-abe773b9b486',
                title: 'We’re glad to hear you were satisfied with our summit. Please tell us what we did well so we can do it again next time.',
                ref: 'q--5u7347',
                refMetric: '',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 5,
                followup: true,
                assets: {},
                integrationId,
                integrationPageId: 'e2fbf080-be6d-11f0-b7ae-abe773b9b486',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qUsefulContent: NativeQuestion = {
                id: 'fc70f7e0-be6d-11f0-b877-294bea1dbc24',
                title: 'Overall, how useful was the content for your day-to-day work?',
                ref: 'q--r2o0o',
                refMetric: 'useful content work',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 6,
                followup: false,
                assets: {min:'1',max:'5'},
                integrationId,
                integrationPageId: 'fc4d6a50-be6d-11f0-b877-294bea1dbc24',
                type: FEEDBACKAPPANSWERTYPE.RATING_NUMBER,
                questionType: {conf: null}
            };
            const qLowUsefulFollowup: NativeQuestion = {
                id: '291f1bf0-be6e-11f0-b877-294bea1dbc24',
                title: 'What should we change for you to give a higher rating?',
                ref: 'q--t4hs89',
                refMetric: '',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 7,
                followup: true,
                assets: {},
                integrationId,
                integrationPageId: '290eef50-be6e-11f0-b877-294bea1dbc24',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qMatrix: NativeQuestion = {
                id: 'd09da6a0-be71-11f0-9909-39e20e5f12bb',
                title: 'Please rate our sessions, based on how interesting / useful you found them.',
                ref: 'q--42jmzb',
                refMetric: 'rate sessions useful',
                require: true,
                external_id: '',
                value: ['Poor','Fair','Good','Excellent'],
                defaultValue: '',
                position: 8,
                followup: false,
                assets: {},
                integrationId,
                integrationPageId: 'd06e5940-be71-11f0-9909-39e20e5f12bb',
                type: FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX,
                questionType: {conf: null}
            };
            const qImproveEvent: NativeQuestion = {
                id: '3c476fc0-be6e-11f0-b877-294bea1dbc24',
                title: 'How can we improve the event for next time?',
                ref: 'q--dt4cn',
                refMetric: 'improve event',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 9,
                followup: false,
                assets: {},
                integrationId,
                integrationPageId: '3c38c9c0-be6e-11f0-b877-294bea1dbc24',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qTopics: NativeQuestion = {
                id: 'ab336ec0-be6d-11f0-8413-437807e9972b',
                title: 'Which other topics would you like us to cover in future events?',
                ref: 'q--ugzvj9',
                refMetric: '',
                require: true,
                external_id: '',
                value: [],
                defaultValue: '',
                position: 10,
                followup: false,
                assets: {},
                integrationId,
                integrationPageId: 'ab1167d0-be6d-11f0-8413-437807e9972b',
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                questionType: {conf: null}
            };
            const qFormats: NativeQuestion = {
                id: 'c6dd7e90-be6d-11f0-8413-437807e9972b',
                title: 'Which of the following formats would you like to see more of at future events?',
                ref: 'q--a7b16g',
                refMetric: 'event formats',
                require: true,
                external_id: '',
                value: [
                    'Panel discussions',
                    'Interactive workshops/Demos',
                    'Dedicated networking sessions',
                    "Case studies/Deep dives from CPO's",
                    'Fireside chats'
                ],
                defaultValue: '',
                position: 11,
                followup: false,
                assets: {},
                integrationId,
                integrationPageId: 'c6c78590-be6e-11f0-8413-437807e9972b',
                type: FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE,
                questionType: {conf: null}
            };

            const pages: Page[] = [
                new Page('3dc59200-be73-11f0-a130-4b60f8068e07', 1, integrationId, [qName], []),
                new Page('cbc7a4b0-b646-11f0-b9c6-0becd5ece65f', 2, integrationId, [qRecommend], [
                    new PageRoute('r-low', qRecommend.ref, OperatorType.INQ, ['1','2','3','4','5','6'], TransitionType.PAGE, 'cbf35540-be6d-11f0-b7ae-abe773b9b486', 'cbc7a4b0-b646-11f0-b9c6-0becd5ece65f', ConditionType.LOGICAL),
                    new PageRoute('r-mid', qRecommend.ref, OperatorType.INQ, ['7','8'], TransitionType.PAGE, 'db412e00-be6d-11f0-b7ae-abe773b9b486', 'cbc7a4b0-b646-11f0-b9c6-0becd5ece65f', ConditionType.LOGICAL),
                    new PageRoute('r-high', qRecommend.ref, OperatorType.INQ, ['9','10'], TransitionType.PAGE, 'e2fbf080-be6d-11f0-b7ae-abe773b9b486', 'cbc7a4b0-b646-11f0-b9c6-0becd5ece65f', ConditionType.LOGICAL),
                ]),
                new Page('cbf35540-be6d-11f0-b7ae-abe773b9b486', 3, integrationId, [qLowFollowup], [
                    new PageRoute('r-to-main-1', qLowFollowup.ref, OperatorType.EQUAL, [], TransitionType.PAGE, 'fc4d6a50-be6d-11f0-b877-294bea1dbc24', 'cbf35540-be6d-11f0-b7ae-abe773b9b486', ConditionType.DIRECT),
                ]),
                new Page('db412e00-be6d-11f0-b7ae-abe773b9b486', 4, integrationId, [qMidFollowup], [
                    new PageRoute('r-to-main-2', qMidFollowup.ref, OperatorType.EQUAL, [], TransitionType.PAGE, 'fc4d6a50-be6d-11f0-b877-294bea1dbc24', 'db412e00-be6d-11f0-b7ae-abe773b9b486', ConditionType.DIRECT),
                ]),
                new Page('e2fbf080-be6d-11f0-b7ae-abe773b9b486', 5, integrationId, [qHighFollowup], []),
                new Page('fc4d6a50-be6d-11f0-b877-294bea1dbc24', 6, integrationId, [qUsefulContent], [
                    new PageRoute('r-useful-high', qUsefulContent.ref, OperatorType.INQ, ['4','5'], TransitionType.PAGE, 'd06e5940-be71-11f0-9909-39e20e5f12bb', 'fc4d6a50-be6d-11f0-b877-294bea1dbc24', ConditionType.LOGICAL),
                    new PageRoute('r-useful-low', qUsefulContent.ref, OperatorType.INQ, ['1','2','3'], TransitionType.PAGE, '290eef50-be6e-11f0-b877-294bea1dbc24', 'fc4d6a50-be6d-11f0-b877-294bea1dbc24', ConditionType.LOGICAL),
                ]),
                new Page('290eef50-be6e-11f0-b877-294bea1dbc24', 7, integrationId, [qLowUsefulFollowup], []),
                new Page('d06e5940-be71-11f0-9909-39e20e5f12bb', 8, integrationId, [qMatrix], []),
                new Page('3c38c9c0-be6e-11f0-b877-294bea1dbc24', 9, integrationId, [qImproveEvent], []),
                new Page('ab1167d0-be6e-11f0-8413-437807e9972b', 10, integrationId, [qTopics], []),
                new Page('c6c78590-be6e-11f0-8413-437807e9972b', 11, integrationId, [qFormats], []),
            ];

            setGraphWithRoutes(pages);
            expect(graph.findMaxDepth()).toBe(9);
        });
    });
});
