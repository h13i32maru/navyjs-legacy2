#include "n_page_dialog.h"
#include "ui_n_page_dialog.h"

#include "util/n_json.h"
#include "util/n_util.h"
#include "n_project.h"

NPageDialog::NPageDialog(TYPE type, NJson &configPage, QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NPageDialog),
    mConfigPage(configPage)
{
    ui->setupUi(this);

    mType = type;

    if (mType == TYPE_CREATE) {
        mPageIndex = configPage.length();
    }

    ui->classFile->setType(NTextListSelector::CODE);
    ui->layout->setType(NTextListSelector::LAYOUT);
    ui->backgroundColor->setText("#000000");

    connect(ui->id, SIGNAL(textChanged(QString)), this, SLOT(autoInputWithId()));
    connect(ui->okButton, SIGNAL(clicked()), this, SLOT(updatePage()));
    connect(ui->cancelButton, SIGNAL(clicked()), this, SLOT(reject()));
    connect(ui->classFile, SIGNAL(textChanged(QString)), this, SLOT(checkClassFile(QString)));
    connect(ui->layout, SIGNAL(textChanged(QString)), this, SLOT(checkLayoutFile(QString)));
}

void NPageDialog::checkClassFile(const QString &path) {
    if (NProject::instance()->existsContentsFile(path)) {
        ui->classFileLabel->setStyleSheet("");
    } else {
        ui->classFileLabel->setStyleSheet("QLabel { color: #ff0000; }");
    }
}

void NPageDialog::checkLayoutFile(const QString &path) {
    if (NProject::instance()->existsContentsFile(path)) {
        ui->layoutLabel->setStyleSheet("");
    } else {
        ui->layoutLabel->setStyleSheet("QLabel { color: #ff0000; }");
    }
}

void NPageDialog::setPageId(const QString &pageId) {
    mPageIndex = mConfigPage.searchValue("id", pageId);
    NJson page = mConfigPage.getObject(QString::number(mPageIndex));

    ui->id->setText(page.getStr("id"));
    ui->className->setText(page.getStr("class"));
    ui->classFile->setText(page.getStr("classFile"));
    ui->layout->setText(page.getStr("extra.contentLayoutFile"));
    ui->backgroundColor->setText(page.getStr("backgroundColor"));
    ui->transition->setCurrentText(page.getStr("extra.transition.class"));
}

void NPageDialog::autoInputWithId() {
    QString id = ui->id->text();
    QString className = id;
    QString fileName = QString(id).replace(QRegExp("([a-z])([A-Z])"), "\\1_\\2").replace(QRegExp("([A-Z])([A-Z])([a-z])"), "\\1_\\2\\3").replace(".", "/").toLower();
    QString codeFilePath = QString("code/") + fileName + ".js";
    QString layoutFilePath = QString("layout/") + fileName + ".json";

    ui->className->setText(className);
    ui->classFile->setText(codeFilePath);
    ui->layout->setText(layoutFilePath);
}

void NPageDialog::updatePage() {
    // id check
    // FIXME: 文字種のチェックを行う
    QString pageId = ui->id->text();
    int pageIndex = mConfigPage.searchValue("id", pageId);
    int pageCount = mConfigPage.countValue("id", pageId);
    switch (mType) {
    case TYPE_CREATE:
        if (pageCount == 0) {
            break;
        }
        return;
    case TYPE_UPDATE:
        if (pageCount == 0) {
            break;
        }
        if (pageCount == 1 && pageIndex == mPageIndex) {
            break;
        }
        return;
    }

    // class check
    QString className = ui->className->text();
    if (className.isEmpty()) {
        return;
    }

    // class file check.
    QString classFile = ui->classFile->text();
    if (!NProject::instance()->existsContentsFile(classFile)) {
        QString path = NProject::instance()->contentsFilePath(classFile);
        QMap<QString, QString> replace;
        replace["{{class}}"] = className;
        if (!NUtil::createFileFromTemplate(":/template_code/page.js", path, replace)) {
            return;
        }
    }

    // layout check
    QString layoutFile = ui->layout->text();
    if (!NProject::instance()->existsContentsFile(layoutFile)) {
        QString path = NProject::instance()->contentsFilePath(layoutFile);
        if (!NUtil::createFileFromTemplate(":/template_code/layout.json", path)) {
            return;
        }
    }

    QString index = QString::number(mPageIndex);
    mConfigPage.set(index + ".id", pageId);
    mConfigPage.set(index + ".class", className);
    mConfigPage.set(index + ".classFile", classFile);
    mConfigPage.set(index + ".extra.contentLayoutFile", layoutFile);
    mConfigPage.set(index + ".backgroundColor", ui->backgroundColor->text());
    mConfigPage.set(index + ".extra.transition.class", ui->transition->currentText());

    accept();
}

NPageDialog::~NPageDialog()
{
    delete ui;
}
