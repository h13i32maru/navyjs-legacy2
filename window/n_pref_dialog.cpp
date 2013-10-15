#include "n_pref_dialog.h"
#include "ui_n_pref_dialog.h"

#include <QFileInfo>
#include <QDir>
#include <QSettings>
#include <QVariant>

const QString NPrefDialog::DONE_PREFERENCE = "donePrefrence";
const QString NPrefDialog::PREVIEW_GOOGLE_CHROME_PATH = "preview/googleChromePath";
const QString NPrefDialog::PREVIEW_ALLOW_FILE_ACCESS_FROM_FILE = "preview/allowFileAccessFromFile";
const QString NPrefDialog::PREVIEW_DISABLE_WEB_SECURITY = "preview/disableWebSecurity";
const QString NPrefDialog::PREVIEW_USER_DATA_DIR = "preview/userDataDir";
const QString NPrefDialog::PREVIEW_OTHER_OPTIONS = "preview/otherOptions";

NPrefDialog::NPrefDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NPrefDialog),
    mSettings("h13i32maru.jp", "NavyCreator")
{
    ui->setupUi(this);

    if (!mSettings.value(DONE_PREFERENCE).toBool()) {
        this->syncWidgetToSettings();
    }

    connect(ui->cancelButton, SIGNAL(clicked()), this, SLOT(reject()));
    connect(ui->okButton, SIGNAL(clicked()), this, SLOT(accept()));
}

void NPrefDialog::syncSettingsToWidget() {
    ui->googleChromeEdit->setText(mSettings.value(PREVIEW_GOOGLE_CHROME_PATH).toString());
    ui->allowFileAccessFromFileCheck->setChecked(mSettings.value(PREVIEW_ALLOW_FILE_ACCESS_FROM_FILE).toBool());
    ui->disableWebSecurityCheck->setChecked(mSettings.value(PREVIEW_DISABLE_WEB_SECURITY).toBool());
    ui->userDataDirEdit->setText(mSettings.value(PREVIEW_USER_DATA_DIR).toString());
    ui->otherOptionsEdit->setText(mSettings.value(PREVIEW_OTHER_OPTIONS).toString());
}

void NPrefDialog::syncWidgetToSettings() {
    mSettings.setValue(PREVIEW_GOOGLE_CHROME_PATH, ui->googleChromeEdit->text());
    mSettings.setValue(PREVIEW_ALLOW_FILE_ACCESS_FROM_FILE, ui->allowFileAccessFromFileCheck->isChecked());
    mSettings.setValue(PREVIEW_DISABLE_WEB_SECURITY, ui->disableWebSecurityCheck->isChecked());
    mSettings.setValue(PREVIEW_USER_DATA_DIR, ui->userDataDirEdit->text());
    mSettings.setValue(PREVIEW_OTHER_OPTIONS, ui->otherOptionsEdit->text());
}

bool NPrefDialog::validate() {
    if (ui->googleChromeEdit->text().isEmpty() || !QFileInfo(ui->googleChromeEdit->text()).exists()) {
        return false;
    }

    // FIXME: 親ディレクトリが存在するかチェック
    if (ui->userDataDirEdit->text().isEmpty()) {
        return false;
    }

    return true;
}

void NPrefDialog::accept() {
    if (validate()) {
        QDialog::accept();
    }
}

int NPrefDialog::exec() {
    this->syncSettingsToWidget();

    int ret = QDialog::exec();

    if (ret == Accepted) {
        mSettings.setValue(DONE_PREFERENCE, true);
        this->syncWidgetToSettings();
    }

    return ret;
}

QSettings *NPrefDialog::getSettings() {
    return &mSettings;
}

NPrefDialog::~NPrefDialog()
{
    delete ui;
}
