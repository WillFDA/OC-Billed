/**
 * @jest-environment jsdom
 */
import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    describe("When I submit the new bill form", () => {
      let store, newBill, onNavigate;

      beforeEach(() => {
        store = {
          bills: jest.fn(() => ({
            create: jest
              .fn()
              .mockResolvedValue({ fileUrl: "test-url", key: "test-key" }),
            update: jest.fn().mockResolvedValue({}),
          })),
        };

        const html = NewBillUI();
        document.body.innerHTML = html;

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        onNavigate = jest.fn((pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        });

        newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });
      });

      test("Then the bill should be created with all data", async () => {
        const testValues = {
          type: "Transports",
          name: "Test expense",
          amount: "100",
          date: "2024-03-14",
          vat: "20",
          pct: "20",
          commentary: "Test commentary",
          fileName: "test.jpg",
        };

        // Fill form
        fireEvent.change(screen.getByTestId("expense-type"), {
          target: { value: testValues.type },
        });
        fireEvent.change(screen.getByTestId("expense-name"), {
          target: { value: testValues.name },
        });
        fireEvent.change(screen.getByTestId("amount"), {
          target: { value: testValues.amount },
        });
        fireEvent.change(screen.getByTestId("datepicker"), {
          target: { value: testValues.date },
        });
        fireEvent.change(screen.getByTestId("vat"), {
          target: { value: testValues.vat },
        });
        fireEvent.change(screen.getByTestId("pct"), {
          target: { value: testValues.pct },
        });
        fireEvent.change(screen.getByTestId("commentary"), {
          target: { value: testValues.commentary },
        });

        // Set file URL and name (normally set by handleChangeFile)
        newBill.fileUrl = "test-url";
        newBill.fileName = "test.jpg";
        newBill.billId = "test-id";

        // Simulate file upload
        const imageFile = new File(["test"], testValues.fileName, {
          type: "image/jpeg",
        });
        const fileInput = screen.getByTestId("file");
        fireEvent.change(fileInput, { target: { files: [imageFile] } });

        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", handleSubmit);
        await fireEvent.submit(form);

        expect(handleSubmit).toHaveBeenCalled();
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);

        const handleSubmitSpy = jest.spyOn(newBill, "updateBill");

        await fireEvent.submit(form);

        // Verify the bill object format
        expect(handleSubmitSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            email: JSON.parse(window.localStorage.getItem("user")).email,
            type: testValues.type,
            name: testValues.name,
            amount: parseInt(testValues.amount), // Verify amount is converted to integer
            date: testValues.date,
            vat: testValues.vat,
            pct: parseInt(testValues.pct), // Verify pct is converted to integer
            commentary: testValues.commentary,
            fileUrl: "test-url",
            fileName: "test.jpg",
            status: "pending",
          })
        );
      });
    });

    describe("When I handle file upload", () => {
      test("Then it should accept valid image formats (JPG, JPEG, PNG)", () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage,
        });

        const input = screen.getByTestId("file");
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
        input.addEventListener("change", handleChangeFile);

        // Test valid PNG file
        const validFile = new File(["image"], "test.png", {
          type: "image/png",
        });
        userEvent.upload(input, validFile);

        expect(input.files[0]).toStrictEqual(validFile);
        expect(input.files).toHaveLength(1);
        expect(handleChangeFile).toHaveBeenCalled();
      });

      test("Then it should reject invalid file formats", () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage,
        });

        const input = screen.getByTestId("file");
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
        input.addEventListener("change", handleChangeFile);

        // Mock alert
        const alertMock = jest
          .spyOn(window, "alert")
          .mockImplementation(() => {});

        // Test invalid file
        const invalidFile = new File(["document"], "test.pdf", {
          type: "application/pdf",
        });
        userEvent.upload(input, invalidFile);

        expect(handleChangeFile).toHaveBeenCalled();
        expect(input.value).toBe("");
        expect(alertMock).toHaveBeenCalledWith(
          "Veuillez sélectionner un fichier au format JPG, JPEG ou PNG."
        );

        alertMock.mockRestore();
      });

      test("Then file upload should work correctly", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        // Mock store avec succès
        const store = {
          bills: jest.fn(() => ({
            create: jest.fn().mockResolvedValue({
              fileUrl: "http://localhost:3456/images/test.jpg",
              key: "1234"
            })
          }))
        };

        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store,
          localStorage: window.localStorage,
        });

        const input = screen.getByTestId("file");
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        
        // Création d'un événement de changement de fichier
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\test.jpg',
            files: [file]
          }
        };

        // Appel direct de handleChangeFile et attente de la résolution
        await newBill.handleChangeFile(event);
        
        expect(newBill.fileUrl).toBe("http://localhost:3456/images/test.jpg");
        expect(newBill.billId).toBe("1234");
        expect(newBill.fileName).toBe("test.jpg");
      });

      test("Then file upload should handle errors", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        // Mock store avec erreur
        const store = {
          bills: jest.fn(() => ({
            create: jest.fn().mockRejectedValue(new Error("Upload failed"))
          }))
        };

        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store,
          localStorage: window.localStorage,
        });

        // Mock console.error
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        const input = screen.getByTestId("file");
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        
        // Simulation du changement de fichier
        await userEvent.upload(input, file);
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(input.value).toBe("");

        consoleSpy.mockRestore();
      });
    });
  });
});
