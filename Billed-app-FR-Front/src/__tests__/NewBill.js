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
      test("Then it should validate file format and attach valid files", () => {
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

        // Test valid formats
        const validFormats = [
          { name: 'test.jpg', type: 'image/jpeg' },
          { name: 'test.jpeg', type: 'image/jpeg' },
          { name: 'test.png', type: 'image/png' }
        ];

        validFormats.forEach(format => {
          const validFile = new File(['image'], format.name, { type: format.type });
          userEvent.upload(input, validFile);

          expect(input.files[0]).toStrictEqual(validFile);
          expect(input.files).toHaveLength(1);
          expect(handleChangeFile).toHaveBeenCalled();
        });
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

      test("Then it should process the file upload through the store successfully", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

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
        
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\test.jpg',
            files: [file]
          }
        };

        await newBill.handleChangeFile(event);
        
        expect(newBill.fileUrl).toBe("http://localhost:3456/images/test.jpg");
        expect(newBill.billId).toBe("1234");
        expect(newBill.fileName).toBe("test.jpg");
      });

      test("Then it should handle store errors during file upload", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

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

        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        const input = screen.getByTestId("file");
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        
        await userEvent.upload(input, file);
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(input.value).toBe("");

        consoleSpy.mockRestore();
      });
    });
  });
  // POST
  describe("When I submit a new bill with POST", () => {
    test("Then the bill should be created successfully", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Préparation du localStorage
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.com"
        })
      );

      // Mock du store avec succès
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({
            fileUrl: "https://localhost:3456/images/test.jpg",
            key: "1234"
          }),
          update: jest.fn().mockResolvedValue({})
        }))
      };

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Simulation du formulaire avec données
      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);

      // Remplissage du formulaire
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transports" }
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: "Test Transport" }
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: "100" }
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: "2024-03-14" }
      });
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: "20" }
      });
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: "20" }
      });
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: "Test comment" }
      });

      // Simulation upload fichier
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const inputFile = screen.getByTestId("file");
      await userEvent.upload(inputFile, file);

      // Soumission du formulaire
      await fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
      expect(store.bills).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });

    test("Then it should handle API error on POST", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Préparation du localStorage
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.com"
        })
      );

      // Mock du store avec erreur
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockRejectedValue(new Error("Erreur 404")),
          update: jest.fn().mockRejectedValue(new Error("Erreur 404"))
        }))
      };

      // Mock de console.error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store,
        localStorage: window.localStorage,
      });

      // Simulation du formulaire avec données
      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);

      // Remplissage du formulaire
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transports" }
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: "Test Transport" }
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: "100" }
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: "2024-03-14" }
      });
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: "20" }
      });
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: "20" }
      });
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: "Test comment" }
      });

      // Simulation upload fichier
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const inputFile = screen.getByTestId("file");
      await userEvent.upload(inputFile, file);

      // Soumission du formulaire
      await fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test("Then it should handle network error", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Simulation d'une erreur réseau
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockRejectedValue(new Error("Network error")),
          update: jest.fn().mockRejectedValue(new Error("Network error"))
        }))
      };

      // Mock de console.error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store,
        localStorage: window.localStorage,
      });

      // Simulation upload fichier avec erreur réseau
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const inputFile = screen.getByTestId("file");
      await userEvent.upload(inputFile, file);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
