import {
    describe,
    test,
    expect,
    beforeEach,
    afterEach,
} from "@jest/globals";

import {Form} from "../src/models/form";
import {Config} from "../src/models/config";

/**
 * Form.generate
 */
describe("Form.generate", () => {
    let container: HTMLElement;

    /**
     * @jest-environment jsdom
     */
    beforeEach(() => {
        // Create a container element for the form
        container = document.createElement("div");
        container.id = "form-container";
        document.body.appendChild(container);
    });

    /**
     *
     */
    afterEach(() => {
        // Clean up the container element after each test
        container.remove();
    });

    /**
     *
     */
    /*test("should add custom event listeners for beforeSubmitEvent and afterSubmitEvent", () => {
      const questions: NativeQuestion[] = [
        // Define your questions here
      ];

      const mockBeforeSubmitEvent = jest.fn();
      const mockAfterSubmitEvent = jest.fn();

      generateForm("app-id", questions, "form-container", {
        beforeSubmitEvent: mockBeforeSubmitEvent,
        afterSubmitEvent: mockAfterSubmitEvent,
      });

      const form = container.querySelector(".magicfeedback-form");

      form?.dispatchEvent(new Event("submit"));

      expect(mockBeforeSubmitEvent).toHaveBeenCalledTimes(1);
      expect(mockAfterSubmitEvent).toHaveBeenCalledTimes(1);
    });
});

/**
 * Form.answer
 */
describe("Form.answer", () => {
    /**
     *
     */
    test("should return an array of NativeAnswer objects with correct values for checked inputs", () => {
        document.body.innerHTML = `
      <form id="magicfeedback-app-id">
        <input type="text" class="magicfeedback-input" name="input1" value="Answer 1">
        <input type="radio" class="magicfeedback-input" name="input2" value="Option 1">
        <input type="radio" class="magicfeedback-input" name="input2" value="Option 2" checked>
        <input type="checkbox" class="magicfeedback-input" name="input3" value="Option A" checked>
        <input type="checkbox" class="magicfeedback-input" name="input3" value="Option B">
      </form>
    `;

        const appId = "app-id";
        const expectedAnswers = [
            {key: "input1", value: ["Answer 1"]},
            {key: "input2", value: ["Option 2"]},
            {key: "input3", value: ["Option A"]},
        ];

        const form = new Form(new Config(), appId, 'public-key');
        const answers = form.answer();
        expect(answers).toEqual(expectedAnswers);
    });

    /**
     *
     */
    test("should return an empty array if the form with the specified ID is not found", () => {
        document.body.innerHTML = "";

        const appId = "nonexistent-app-id";

        const form = new Form(new Config(), appId, 'public-key');
        const answers = form.answer();

        expect(answers).toEqual([]);
    });

    /**
     *
     */
    test("should return an empty array if no inputs are present in the form", () => {
        document.body.innerHTML = `
      <form id="magicfeedback-app-id"></form>
    `;

        const appId = "app-id";

        const form = new Form(new Config(), appId, 'public-key');
        const answers = form.answer();

        expect(answers).toEqual([]);
    });

    /**
     *
     */
    test("should handle multiple inputs with the same name correctly", () => {
        document.body.innerHTML = `
      <form id="magicfeedback-app-id">
        <input type="checkbox" class="magicfeedback-input" name="input1" value="Option A" checked>
        <input type="checkbox" class="magicfeedback-input" name="input1" value="Option B" checked>
        <input type="checkbox" class="magicfeedback-input" name="input1" value="Option C">
      </form>
    `;

        const appId = "app-id";
        const expectedAnswers = [
            {key: "input1", value: ["Option A"]},
            {key: "input1", value: ["Option B"]},
        ];

        const form = new Form(new Config(), appId, 'public-key');
        const answers = form.answer();

        expect(answers).toEqual(expectedAnswers);
    });

    /**
     * Form.send
     */
    describe("Form.send", () => {
        /*beforeEach(() => {
          // Mock the fetch function
          jest.spyOn(global, "fetch").mockResolvedValueOnce({
            "ok": true,
            "status": 200,
            "statusText": "OK",
            //"json": jest.fn().mockResolvedValueOnce({}),
          });
        });

        afterEach(() => {
          jest.restoreAllMocks();
        });

        test("should send survey answers successfully", async () => {
          const appId = "nonexistent-app-id";
          const form = new Form(new Config(), appId);

          // Mock the answer() function to return sample survey answers
          form.answer = jest.fn(() => [
            {
              id: "question1",
              type: "checkbox",
              value: ["option1", "option2"],
            },
            {
              id: "question2",
              type: "radio",
              value: ["option3"],
            },
          ]);

          // Call the send() function
          await form.send();

          // Check if fetch() was called with the correct arguments
          expect(fetch).toHaveBeenCalledWith("https://example.com/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              {
                id: "question1",
                type: "checkbox",
                value: ["option1", "option2"],
              },
              {
                id: "question2",
                type: "radio",
                value: ["option3"],
              },
            ]),
          });

          // Add additional assertions as needed
        });

        test("should handle error response when sending survey answers", async () => {
          const appId = "nonexistent-app-id";
          const form = new Form(new Config(), appId);

          // Mock the answer() function to return sample survey answers
          form.answer = jest.fn(() => [
            {
              id: "question1",
              type: "text",
              value: ["answer1"],
            },
          ]);

          // Mock the fetch function to return an error response
          jest.spyOn(global, "fetch").mockResolvedValueOnce({
            "ok": false,
            "status": 500,
            "statusText": "Internal Server Error",
          });

          // Call the send() function
          await form.send();

          // Check if fetch() was called with the correct arguments
          expect(fetch).toHaveBeenCalledWith("https://example.com/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              {
                id: "question1",
                type: "text",
                value: ["answer1"],
              },
            ]),
          });

          // Check if appropriate error handling logic is implemented
          // For example, you can assert that an error message is logged or specific error handling actions are taken

          // Add additional assertions as needed
        });*/
    });
});
});
