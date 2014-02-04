#include "n_pref_dialog.h"
#include "ui_n_pref_dialog.h"

#include <QFileInfo>
#include <QDir>
#include <QSettings>
#include <QVariant>
#include <QDebug>

const QString NPrefDialog::DONE_PREFERENCE = "donePrefrence";
const QString NPrefDialog::PREVIEW_GOOGLE_CHROME_PATH = "preview/googleChromePath";
const QString NPrefDialog::PREVIEW_ALLOW_FILE_ACCESS_FROM_FILE = "preview/allowFileAccessFromFile";
const QString NPrefDialog::PREVIEW_DISABLE_WEB_SECURITY = "preview/disableWebSecurity";
const QString NPrefDialog::PREVIEW_USER_DATA_DIR = "preview/userDataDir";
const QString NPrefDialog::PREVIEW_OTHER_OPTIONS = "preview/otherOptions";
const QString NPrefDialog::NODE_JS_PATH = "pref/nodejsPath";

NPrefDialog::NPrefDialog(QWidget *parent) : QDialog(parent), ui(new Ui::NPrefDialog), mSettings("h13i32maru.jp", "NavyCreator") {
    ui->setupUi(this);

    if (!mSettings.value(DONE_PREFERENCE).toBool()) {
        this->setDefault();
    }

    connect(ui->cancelButton, SIGNAL(clicked()), this, SLOT(reject()));
    connect(ui->okButton, SIGNAL(clicked()), this, SLOT(accept()));
    connect(ui->defaultButton, SIGNAL(clicked()), this, SLOT(setDefault()));
}

void NPrefDialog::setDefault() {
    // nodejs
    ui->nodejsPath->setText("/usr/local/bin/node");

    // chrome
    ui->googleChromeEdit->setText("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
    ui->allowFileAccessFromFileCheck->setChecked(true);
    ui->disableWebSecurityCheck->setChecked(true);
    ui->userDataDirEdit->setText(QDir::homePath() + "/.navy_creator_chrome");
    ui->otherOptionsEdit->setText("");

}

void NPrefDialog::syncSettingsToWidget() {
    // nodejs
    ui->nodejsPath->setText(mSettings.value(NODE_JS_PATH).toString());

    // chrome
    ui->googleChromeEdit->setText(mSettings.value(PREVIEW_GOOGLE_CHROME_PATH).toString());
    ui->allowFileAccessFromFileCheck->setChecked(mSettings.value(PREVIEW_ALLOW_FILE_ACCESS_FROM_FILE).toBool());
    ui->disableWebSecurityCheck->setChecked(mSettings.value(PREVIEW_DISABLE_WEB_SECURITY).toBool());
    ui->userDataDirEdit->setText(mSettings.value(PREVIEW_USER_DATA_DIR).toString());
    ui->otherOptionsEdit->setText(mSettings.value(PREVIEW_OTHER_OPTIONS).toString());
}

void NPrefDialog::syncWidgetToSettings() {
    // nodejs
    mSettings.setValue(NODE_JS_PATH, ui->nodejsPath->text());

    // chrome
    mSettings.setValue(PREVIEW_GOOGLE_CHROME_PATH, ui->googleChromeEdit->text());
    mSettings.setValue(PREVIEW_ALLOW_FILE_ACCESS_FROM_FILE, ui->allowFileAccessFromFileCheck->isChecked());
    mSettings.setValue(PREVIEW_DISABLE_WEB_SECURITY, ui->disableWebSecurityCheck->isChecked());
    mSettings.setValue(PREVIEW_USER_DATA_DIR, ui->userDataDirEdit->text());
    mSettings.setValue(PREVIEW_OTHER_OPTIONS, ui->otherOptionsEdit->text());
}

bool NPrefDialog::validate() {
    if (ui->nodejsPath->text().isEmpty() || !QFileInfo(ui->nodejsPath->text()).exists()) {
        return false;
    }

    if (ui->googleChromeEdit->text().isEmpty() || !QFileInfo(ui->googleChromeEdit->text()).exists()) {
        return false;
    }

    /*
     * ディレクトリが指定されていればそのディレクトリが存在するか確認する.
     * 存在しない場合はディレクトリ作成する.
     */
    QString userDataDirPath = ui->userDataDirEdit->text();
    if (!userDataDirPath.isEmpty()) {
        if (!QFileInfo(userDataDirPath).exists()) {
            QString dirName = QFileInfo(userDataDirPath).fileName();
            QDir parentDir = QFileInfo(userDataDirPath).dir();
            if (!parentDir.exists()) {
                return false;
            }

            bool ret = parentDir.mkdir(dirName);
            if (!ret) {
                return ret;
            }
        }
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
