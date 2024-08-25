/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(0[1-9]|[12][0-9]|3[01]) [A-Za-zéû]{3,4}\. \d{2}$/i).map(a => a.innerHTML)
      
      // Fonction pour convertir une chaîne de date en objet Date
      const parseDate = (dateString) => {
        const [day, monthAbbr, year] = dateString.split(' ')
        const months = {
          'Jan.': 0, 'Fév.': 1, 'Mar.': 2, 'Avr.': 3, 'Mai.': 4, 'Juin': 5,
          'Juil.': 6, 'Aoû.': 7, 'Sep.': 8, 'Oct.': 9, 'Nov.': 10, 'Déc.': 11
        }
        const month = months[monthAbbr]
        const fullYear = 2000 + parseInt(year)
        return new Date(fullYear, month, parseInt(day))
      }
    
      // Trier les dates du plus récent au plus ancien
      const datesSorted = [...dates].sort((a, b) => parseDate(b) - parseDate(a))
      
      expect(dates).toEqual(datesSorted)
    })
  })
})
