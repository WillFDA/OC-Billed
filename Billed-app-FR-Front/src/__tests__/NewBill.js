/**
 * @jest-environment jsdom
 */
import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then i can only put a image (PDF, JPG, PNG) for proof", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      //to-do write assertion
      const input = screen.getByTestId("file");
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      expect(input).toBeTruthy();
      input.addEventListener("change", handleChangeFile);
      const imagePNG = new File(["facture"], "facture.png", {
        type: "image/png",
      });
      userEvent.upload(input, imagePNG);
      expect(input.files[0]).toStrictEqual(imagePNG);
      expect(input.files.item(0)).toStrictEqual(imagePNG);
      expect(input.files).toHaveLength(1);
      const alertMock = jest
        .spyOn(window, "alert")
        .mockImplementation(() => {});

      // Test avec un fichier .exe invalide
      const badFile = new File(["facture"], "facture.exe", {
        type: "application/x-msdownload",
      });
      userEvent.upload(input, badFile);

      // Vérifie que handleChangeFile a été appelé
      expect(handleChangeFile).toHaveBeenCalled();

      // Vérifie que l'input a été réinitialisé (valeur vide)
      expect(input.value).toBe("");

      // Vérifie que l'alerte a été appelée avec le bon message
      expect(alertMock).toHaveBeenCalledWith(
        "Veuillez sélectionner un fichier au format JPG, JPEG ou PNG."
      );

      // Cleanup
      alertMock.mockRestore();
    });
  });
});
