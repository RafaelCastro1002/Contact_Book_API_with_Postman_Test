import { Request, Response } from 'express'
import { validateContactInputs, ContactModel, validateBirthdayPeriodFormat } from '../domains/ContactModel'
import { ContactDAO } from '../dao/ContactDAO'

export class ContactController {
  private _contactDAO: ContactDAO

  constructor() {
    this._contactDAO = new ContactDAO()
  }

  async save(req: Request, res: Response) {
    const errorMessages = validateContactInputs(req.body)

    if (errorMessages.length == 0) {
      const { name, email, phone, birthday } = req.body

      const userAlreadyExists = await this._contactDAO.findByEmail(email)

      if (userAlreadyExists) {
        errorMessages.push('A user with this email already exists')

        return res.status(409).json({ errorMessages })
      } else {
        const contact = new ContactModel({
          name,
          email,
          phone,
          birthday: new Date(birthday),
        })
  
        const savedContact = await this._contactDAO.save(contact)
        return res.status(201).json({ contact: savedContact })
      }
    }

    return res.status(400).json({ errorMessages })
  }

  async findByName(req: Request, res: Response) {
    const { name } = req.params

    const contacts = await this._contactDAO.findByName(name)

    return res.status(200).json({ contacts })
  }

  async findByEmail(req: Request, res: Response) {
    const { email } = req.params

    const contact = await this._contactDAO.findByEmail(email)

    return res.status(200).json({ contact })
  }

  async findByBirthdayPeriod(req: Request, res: Response) {
    const { start, end } = req.query

    let errorMessages: string[] = []
    
    errorMessages = errorMessages.concat(validateBirthdayPeriodFormat(start, end))

    if (errorMessages.length > 0) {
      return res.status(400).json({ errorMessages })
    }

    const startDate = new Date(`${start}`)
    const endDate = new Date(`${end}`)


    if (startDate <= endDate) {
      const contacts = await this._contactDAO.findByBirthdayPeriod(
        startDate,
        endDate
      )

      return res.status(200).json({ contacts })
    }

    errorMessages.push('Start date cannot be greater than end date')
    return res.status(400).json({ errorMessages })
  }
}
