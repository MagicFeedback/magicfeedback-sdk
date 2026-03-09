import {FEEDBACKAPPANSWERTYPE} from "../models/types";
import {QuestionRenderer} from "./types";
import {renderChoice} from "./renderChoice";
import {renderLongText} from "./renderLongText";
import {renderNumber} from "./renderNumber";
import {renderText} from "./renderText";
import {renderBoolean} from "./renderBoolean";
import {renderSelect} from "./renderSelect";
import {renderDate} from "./renderDate";
import {renderEmail} from "./renderEmail";
import {renderPassword} from "./renderPassword";
import {renderConsent} from "./renderConsent";
import {renderRatingEmoji} from "./renderRatingEmoji";
import {renderRatingNumber} from "./renderRatingNumber";
import {renderRatingStar} from "./renderRatingStar";
import {renderMatrix} from "./renderMatrix";
import {renderPriorityList} from "./renderPriorityList";
import {renderPointSystem} from "./renderPointSystem";
import {renderUploadImage} from "./renderUploadImage";
import {renderUploadFile} from "./renderUploadFile";
import {renderMultipleChoiceImage} from "./renderMultipleChoiceImage";
import {renderInfoPage} from "./renderInfoPage";

const registry = new Map<FEEDBACKAPPANSWERTYPE, QuestionRenderer>([
    [FEEDBACKAPPANSWERTYPE.TEXT, renderText],
    [FEEDBACKAPPANSWERTYPE.LONGTEXT, renderLongText],
    [FEEDBACKAPPANSWERTYPE.NUMBER, renderNumber],
    [FEEDBACKAPPANSWERTYPE.RADIO, renderChoice],
    [FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE, renderChoice],
    [FEEDBACKAPPANSWERTYPE.BOOLEAN, renderBoolean],
    [FEEDBACKAPPANSWERTYPE.SELECT, renderSelect],
    [FEEDBACKAPPANSWERTYPE.DATE, renderDate],
    [FEEDBACKAPPANSWERTYPE.EMAIL, renderEmail],
    [FEEDBACKAPPANSWERTYPE.PASSWORD, renderPassword],
    [FEEDBACKAPPANSWERTYPE.CONSENT, renderConsent],
    [FEEDBACKAPPANSWERTYPE.RATING_EMOJI, renderRatingEmoji],
    [FEEDBACKAPPANSWERTYPE.RATING_NUMBER, renderRatingNumber],
    [FEEDBACKAPPANSWERTYPE.RATING_STAR, renderRatingStar],
    [FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX, renderMatrix],
    [FEEDBACKAPPANSWERTYPE.PRIORITY_LIST, renderPriorityList],
    [FEEDBACKAPPANSWERTYPE.POINT_SYSTEM, renderPointSystem],
    [FEEDBACKAPPANSWERTYPE.UPLOAD_IMAGE, renderUploadImage],
    [FEEDBACKAPPANSWERTYPE.UPLOAD_FILE, renderUploadFile],
    [FEEDBACKAPPANSWERTYPE.MULTIPLECHOISE_IMAGE, renderMultipleChoiceImage],
    [FEEDBACKAPPANSWERTYPE.INFO_PAGE, renderInfoPage],
]);

export function getQuestionRenderer(type: FEEDBACKAPPANSWERTYPE | string): QuestionRenderer | undefined {
    return registry.get(type as FEEDBACKAPPANSWERTYPE);
}
