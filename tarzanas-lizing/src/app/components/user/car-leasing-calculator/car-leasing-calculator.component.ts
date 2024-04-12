import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MonthlyPaymentCalculatorService } from '../../../services/car-leasing-calculator.service';
import { CalculatorFormFields } from '../../../types';

@Component({
  selector: 'app-car-leasing-calculator',
  standalone: true,
  imports: [MatSlideToggleModule, ReactiveFormsModule],
  templateUrl: './car-leasing-calculator.component.html',
  styleUrl: './car-leasing-calculator.component.scss'
})
export class CarLeasingCalculatorComponent implements OnInit {
  calculatorForm = this.makeForm();
  monthlyPayment: string = "CUSTOM VALUE";
  private service = inject(MonthlyPaymentCalculatorService);
  noteActive: boolean = true;

  ngOnInit(): void {
    this.calculatorForm.valueChanges.subscribe(x => {
      this.checkDownPayment();
      this.calculateMonthlyPayment();
    })
  }

  private makeForm() {
    return new FormGroup(
      {
        carValue: new FormControl<number | null>(null, [
          Validators.required,
          Validators.min(300)
        ]),
        period: new FormControl<string>('months', [
          Validators.required,
          Validators.pattern('[^a-zA-Z]*')
        ]),
        downPayment: new FormControl<number | null>(null, [
          Validators.required,
          Validators.min(0)
        ]),
        residual: new FormControl<string>('0'),
        envFriendly: new FormControl<boolean>(false)
      });
  }

  onSubmit(): void {
    if (!this.calculatorForm.valid) {
      return;
    }

    this.service.postCarCalculatorData({
      carValue: this.carValue?.value!,
      period: this.period?.value!,
      downPayment: this.downPayment?.value!,
      residualValuePercentage: this.residual?.value!,
      isEcoFriendly: this.envFriendly?.value!,
      monthlyPayment: this.monthlyPayment
    });

  }

  calculateMonthlyPayment(): void {
    if (this.calculatorForm.valid) {
      this.monthlyPayment = this.service.getMonthlyPayment(this.calculatorForm.value as Partial<CalculatorFormFields>);
    }

    return;
  }

  checkDownPayment() {
    if (parseInt(this.calculatorForm.value.residual!) >= 10) {
      this.noteActive = false;
      return;
    }
    this.noteActive = true;
  }

  get carValue() {
    return this.calculatorForm.get('carValue');
  }

  get downPayment() {
    return this.calculatorForm.get('downPayment');
  }

  get period() {
    return this.calculatorForm.get('period');
  }

  get residual() {
    return this.calculatorForm.get('residual');
  }

  get envFriendly() {
    return this.calculatorForm.get('envFriendly');
  }
}
