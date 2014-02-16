#include "n_scene_dialog.h"
#include "ui_n_scene_dialog.h"

#include "n_project.h"

#include <util/n_util.h>
#include <QDebug>

NSceneDialog::NSceneDialog(TYPE type, NJson &configScene, QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NSceneDialog),
    mConfigScene(configScene)
{
    ui->setupUi(this);

    mType = type;

    if (mType == TYPE_CREATE) {
        mSceneIndex = configScene.length();
    }

    ui->classFile->setType(NTextListSelector::CODE);
    ui->page->setType(NTextListSelector::PAGE);
    ui->layout->setType(NTextListSelector::LAYOUT);
    ui->backgroundColor->setText("#000000");

    connect(ui->id, SIGNAL(textChanged(QString)), this, SLOT(autoInputWithId()));
    connect(ui->okButton, SIGNAL(clicked()), this, SLOT(updateScene()));
    connect(ui->cancelButton, SIGNAL(clicked()), this, SLOT(reject()));
    connect(ui->classFile, SIGNAL(textChanged(QString)), this, SLOT(checkClassFile(QString)));
    connect(ui->layout, SIGNAL(textChanged(QString)), this, SLOT(checkLayoutFile(QString)));
    connect(ui->page, SIGNAL(textChanged(QString)), this, SLOT(checkPage(QString)));
}

void NSceneDialog::checkClassFile(const QString &path) {
    if (NProject::instance()->existsContentsFile(path)) {
        ui->classFileLabel->setStyleSheet("");
    } else {
        ui->classFileLabel->setStyleSheet("QLabel { color: #ff0000; }");
    }
}

void NSceneDialog::checkLayoutFile(const QString &path) {
    if (NProject::instance()->existsContentsFile(path)) {
        ui->layoutLabel->setStyleSheet("");
    } else {
        ui->layoutLabel->setStyleSheet("QLabel { color: #ff0000; }");
    }
}

void NSceneDialog::checkPage(const QString &page) {
    if (NProject::instance()->existsPage(page)) {
        ui->pageLabel->setStyleSheet("");
    } else {
        ui->pageLabel->setStyleSheet("QLabel { color: #ff0000; }");
    }
}

void NSceneDialog::setSceneId(const QString &sceneId) {
    mSceneIndex = mConfigScene.searchValue("id", sceneId);
    NJson scene = mConfigScene.getObject(QString::number(mSceneIndex));

    ui->id->setText(scene.getStr("id"));
    ui->className->setText(scene.getStr("class"));
    ui->classFile->setText(scene.getStr("classFile"));
    ui->page->setText(scene.getStr("extra.page"));
    ui->layout->setText(scene.getStr("extra.contentLayoutFile"));
    ui->backgroundColor->setText(scene.getStr("backgroundColor"));
    ui->transition->setCurrentText(scene.getStr("extra.transition.class"));
}

void NSceneDialog::autoInputWithId() {
    QString id = ui->id->text();
    QString className = id;
    QString fileName = QString(id).replace(QRegExp("([a-z])([A-Z])"), "\\1_\\2").replace(QRegExp("([A-Z])([A-Z])([a-z])"), "\\1_\\2\\3").replace(".", "/").toLower();
    QString codeFilePath = QString("code/") + fileName + ".js";
    QString layoutFilePath = QString("layout/") + fileName + ".json";

    ui->className->setText(className);
    ui->classFile->setText(codeFilePath);
    ui->layout->setText(layoutFilePath);
}

void NSceneDialog::updateScene() {
    // id check
    QString sceneId = ui->id->text();
    int sceneIndex = mConfigScene.searchValue("id", sceneId);
    int sceneCount = mConfigScene.countValue("id", sceneId);
    switch (mType) {
    case TYPE_CREATE:
        if (sceneCount == 0) {
            break;
        }
        return;
    case TYPE_UPDATE:
        if (sceneCount == 0) {
            break;
        }
        if (sceneCount == 1 && sceneIndex == mSceneIndex) {
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
        if (!NUtil::createFileFromTemplate(":/template_code/scene.js", path, replace)) {
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

    // page check
    QString page = ui->page->text();
    if (!NProject::instance()->existsPage(page)) {
        return;
    }

    QString index = QString::number(mSceneIndex);
    mConfigScene.set(index + ".id", sceneId);
    mConfigScene.set(index + ".class", className);
    mConfigScene.set(index + ".classFile", classFile);
    mConfigScene.set(index + ".extra.contentLayoutFile", layoutFile);
    mConfigScene.set(index + ".extra.page", page);
    mConfigScene.set(index + ".backgroundColor", ui->backgroundColor->text());
    mConfigScene.set(index + ".extra.transition.class", ui->transition->currentText());

    accept();
}

NSceneDialog::~NSceneDialog()
{
    delete ui;
}
