import { Component, OnInit, OnDestroy } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { CommunicationService } from 'src/app/shared/services/communication.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-hamming',
  templateUrl: './hamming.component.html',
  styleUrls: ['./hamming.component.scss']
})
export class HammingComponent implements OnInit, OnDestroy {
  dataForm: FormGroup;
  coding = false;
  config: any;
  bytes: number[][] = [];
  errorInBytes: number[][] = [];
  unsuscribe: Subject<boolean> = new Subject<boolean>();

  constructor(
    private communicationService: CommunicationService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.config = this.communicationService.getConfig();
    if (!!!this.config) {
      alert('No hay configuración predefinida');
      this.router.navigate(['']);
    }
    this.dataForm = this.fb.group({
      text: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.communicationService
      .getMessages()
      .pipe(takeUntil(this.unsuscribe))
      .subscribe(
        (msg: any) => {
          if (msg.state === 'error' && msg.code === 104) {
            alert('Se desconecto el receptor');
            this.router.navigate(['']);
          }
        },
        error => {
          alert('Error');
          this.router.navigate(['']);
        }
      );
  }

  ngOnDestroy() {
    this.unsuscribe.next(true);
    this.unsuscribe.unsubscribe();
  }

  sendMessage() {
    let msg = '';
    this.bytes.forEach(byte => {
      msg = msg + byte.join('') + '-';
    });
    msg = msg.substring(0, msg.length - 1);
    this.communicationService.sendMessage(msg);
    msg = '';
    alert('Mensaje enviado');
  }
  // tslint:disable: no-bitwise
  in_parallel(v: number) {
    v ^= v >> 16;
    v ^= v >> 8;
    v ^= v >> 4;
    v &= 0xf;
    return (0x6996 >> v) & 1;
  }

  blank() {
    this.errorInBytes = new Array(this.bytes.length);
    for (let i = 0; i < this.bytes.length; i++) {
      this.errorInBytes[i] = new Array(12).fill(0);
    }
  }

  errors() {
    for (let i = 0; i < this.bytes.length; i++) {
      this.setState(i, Math.floor(Math.random() * 9));
    }
  }

  code() {
    this.bytes = [];
    let tmp = [];
    for (const char of this.dataForm.get('text').value) {
      if (!!char) {
        const charCode: number = char.charCodeAt();
        const val = this.pad(charCode.toString(2));
        const codingText = this.enconde(val);
        for (const bit of codingText) {
          if (!!bit) {
            tmp.push(parseInt(bit, 10));
          }
        }
        this.bytes.push(tmp);
        tmp = [];
      }
    }
    this.blank();
    this.coding = true;
  }

  enconde(data: string) {
    const p1 = this.in_parallel(
      parseInt(data[0] + data[1] + data[3] + data[4] + data[6], 2)
    );
    const p2 = this.in_parallel(
      parseInt(data[0] + data[2] + data[3] + data[5] + data[6], 2)
    );
    const p3 = this.in_parallel(
      parseInt(data[1] + data[2] + data[3] + data[7], 2)
    );
    const p4 = this.in_parallel(
      parseInt(data[4] + data[5] + data[6] + data[7], 2)
    );
    return `${p1}${p2}${data[0]}${p3}${data[1]}${data[2]}${data[3]}${p4}${
      data[4]
    }${data[5]}${data[6]}${data[7]}`;
  }

  up() {
    window.scroll(0, 0);
  }

  pad(num: string, size: number = 8) {
    const s = '000000000000000' + num;
    return s.substr(s.length - size);
  }

  setState(i: number, j: number) {
    this.errorInBytes[i][j] = !this.errorInBytes[i][j] ? 1 : 0;
    this.bytes[i][j] = !this.bytes[i][j] ? 1 : 0;
  }
}
