import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing';

// providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-custom-amount',
  templateUrl: 'custom-amount.html'
})
export class CustomAmountPage {
  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallet;
  public showShareButton: boolean;
  public amountUnitStr: string;
  public amountCoin: string;
  public altAmountStr: string;

  constructor(
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private platformProvider: PlatformProvider,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private socialSharing: SocialSharing,
    private txFormatProvider: TxFormatProvider,
    private actionSheetProvider: ActionSheetProvider,
    private navCtrl: NavController
  ) {
    const walletId = this.navParams.data.id;
    this.showShareButton = this.platformProvider.isCordova;

    this.wallet = this.profileProvider.getWallet(walletId);

    this.walletProvider.getAddress(this.wallet, false).then(addr => {
      const address = this.walletProvider.getAddressView(
        this.wallet.coin,
        addr
      );

      const protoAddress = this.walletProvider.getProtoAddress(
        this.wallet.coin,
        this.wallet.network,
        address
      );

      this.address =
        this.wallet.coin == 'bch' && !this.walletProvider.useLegacyAddress()
          ? protoAddress.toLowerCase()
          : address;

      const parsedAmount = this.txFormatProvider.parseAmount(
        this.wallet.coin,
        this.navParams.data.amount,
        this.navParams.data.currency
      );

      // Amount in USD or BTC
      const _amount = parsedAmount.amount;
      const _currency = parsedAmount.currency;
      this.amountUnitStr = parsedAmount.amountUnitStr;

      if (_currency != 'BTC' && _currency != 'BCH') {
        // Convert to BTC or BCH
        const amountUnit = this.txFormatProvider.satToUnit(
          parsedAmount.amountSat
        );
        var btcParsedAmount = this.txFormatProvider.parseAmount(
          this.wallet.coin,
          amountUnit,
          this.wallet.coin.toUpperCase()
        );

        this.amountCoin = btcParsedAmount.amount;
        this.altAmountStr = btcParsedAmount.amountUnitStr;
      } else {
        this.amountCoin = _amount; // BTC or BCH
        this.altAmountStr = this.txFormatProvider.formatAlternativeStr(
          this.wallet.coin,
          parsedAmount.amountSat
        );
      }

      this.qrAddress =
        protoAddress.toLowerCase() + '?amount=' + this.amountCoin;
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CustomAmountPage');
  }

  public shareAddress(): void {
    this.socialSharing.share(this.qrAddress);
  }

  public showFullInfo(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'custom-amount',
      {
        qrAddress: this.qrAddress
      }
    );
    infoSheet.present();
  }

  public showPaymentRequestInfo(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'payment-request',
      {
        amount: this.amountUnitStr,
        name: this.wallet.name
      }
    );
    infoSheet.present();
  }

  public close(): void {
    this.navCtrl.popToRoot();
  }
}
