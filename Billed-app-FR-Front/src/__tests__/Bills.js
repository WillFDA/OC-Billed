/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";

import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import $ from "jquery";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(/^(0[1-9]|[12][0-9]|3[01]) [A-Za-zéû]{3,4}\. \d{2}$/i)
        .map((a) => a.innerHTML);

      // Fonction pour convertir une chaîne de date en objet Date
      const parseDate = (dateString) => {
        const [day, monthAbbr, year] = dateString.split(" ");
        const months = {
          "Jan.": 0,
          "Fév.": 1,
          "Mar.": 2,
          "Avr.": 3,
          "Mai.": 4,
          Juin: 5,
          "Juil.": 6,
          "Aoû.": 7,
          "Sep.": 8,
          "Oct.": 9,
          "Nov.": 10,
          "Déc.": 11,
        };
        const month = months[monthAbbr];
        const fullYear = 2000 + parseInt(year);
        return new Date(fullYear, month, parseInt(day));
      };

      // Trier les dates du plus récent au plus ancien
      const datesSorted = [...dates].sort(
        (a, b) => parseDate(b) - parseDate(a)
      );

      expect(dates).toEqual(datesSorted);
    });

    describe("When I am on Bills Page and I click on the eye icon", () => {
      test("Then a modal should open displaying the bill image", () => {
        // Simule l'authentification en tant qu'employé
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        // Simule le DOM de la page Bills
        const html = BillsUI({ data: bills });
        document.body.innerHTML = html;

        // Mock la fonction de navigation
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        // Initialise l'instance de Bills
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        // Ajoute la modale au DOM
        const modale = document.createElement("div");
        modale.setAttribute("id", "modaleFile");
        modale.classList.add("modal", "fade");
        modale.innerHTML = `
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-body"></div>
            </div>
          </div>`;
        document.body.append(modale);

        // Mock la fonction modal de jQuery
        $.fn.modal = jest.fn(function (action) {
          if (action === "show") {
            this.addClass("show");
          }
        });

        // Récupère la première icône œil et simule le clic
        const eyeIcon = screen.getAllByTestId("icon-eye")[0];
        const handleClickIconEye = jest.fn((icon) =>
          billsContainer.handleClickIconEye(icon)
        );
        eyeIcon.addEventListener("click", () => handleClickIconEye(eyeIcon));
        fireEvent.click(eyeIcon);

        // Vérifie que la fonction handleClickIconEye a été appelée
        expect(handleClickIconEye).toHaveBeenCalled();

        // Vérifie que la modale s'affiche avec l'image de la facture
        const modal = document.getElementById("modaleFile");
        expect(modal).toBeTruthy();
        expect(modal.classList).toContain("show");
        const modalBody = modal.querySelector(".modal-body");
        expect(modalBody.innerHTML).toContain("img");
      });
    });
  });
});
