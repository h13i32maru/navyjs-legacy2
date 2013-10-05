#include "window/n_text_dialog.h"
#include "n_config_scene_widget.h"
#include "util/n_util.h"
#include "ui_n_config_scene_widget.h"

#include <QCompleter>
#include <QMenu>
#include <QMessageBox>
#include <QStringListModel>
#include <QDebug>
#include <QDir>

NConfigSceneWidget::NConfigSceneWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : NFileWidget(projectDir, filePath, parent), ui(new Ui::NConfigSceneWidget)
{
    ui->setupUi(this);

    mConfigScene.parseFromFilePath(filePath);
    syncJsonToTree();

    {
        QStringList codeList = NUtil::recursiveEntryList(mProjectDir.absoluteFilePath("code"), "code/");
        QCompleter *completer = new QCompleter(codeList, this);
        completer->setModelSorting(QCompleter::CaseInsensitivelySortedModel);
        completer->setCaseSensitivity(Qt::CaseInsensitive);
        ui->classFileEdit->setCompleter(completer);
    }

    {
        QStringList layoutList = NUtil::recursiveEntryList(mProjectDir.absoluteFilePath("layout"), "layout/");
        QCompleter *completer = new QCompleter(layoutList, this);
        completer->setModelSorting(QCompleter::CaseInsensitivelySortedModel);
        completer->setCaseSensitivity(Qt::CaseInsensitive);
        ui->layoutEdit->setCompleter(completer);
    }

    {
        NJson pageJson;
        pageJson.parseFromFilePath(mProjectDir.absoluteFilePath("config/page.json"));
        QStringList pageList;
        for (int i = 0; i < pageJson.length(); i++) {
            QString index = QString::number(i);
            pageList.append(pageJson.getStr(index + ".id"));
        }

        QCompleter *completer = new QCompleter(pageList, this);
        completer->setModelSorting(QCompleter::CaseInsensitivelySortedModel);
        completer->setCaseSensitivity(Qt::CaseInsensitive);
        ui->pageEdit->setCompleter(completer);
    }

    connect(ui->sceneConfigTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
    connect(ui->sceneConfigTreeWidget, SIGNAL(currentItemChanged(QTreeWidgetItem*,QTreeWidgetItem*)), this, SLOT(syncTreeItemToForm(QTreeWidgetItem*)));
    connect(ui->updateButton, SIGNAL(clicked(bool)), this, SLOT(syncFormToJson()));
}

bool NConfigSceneWidget::innerSave() {
    QFile configSceneFile(mFilePath);
    if (!configSceneFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
        return false;
    }
    int ret = configSceneFile.write(this->mConfigScene.stringify());

    return (ret == -1 ? false: true);
}

int NConfigSceneWidget::countScene(const QString &sceneId) {
    int count = 0;

    for (int i = 0; i < mConfigScene.length(); i++) {
        QString index = QString::number(i);
        QString id = mConfigScene.getStr(index + ".id");

        if (sceneId == id) {
            count++;
        }
    }

    return count;
}

int NConfigSceneWidget::searchScene(const QString &sceneId) {
    for (int i = 0; i < mConfigScene.length(); i++) {
        QString index = QString::number(i);
        QString id = mConfigScene.getStr(index + ".id");

        if (sceneId == id) {
            return i;
        }
    }

    return -1;
}

void NConfigSceneWidget::syncJsonToTree() {
    ui->sceneConfigTreeWidget->clear();

    QList<QTreeWidgetItem *> items;
    for (int i = 0; i < mConfigScene.length(); i++) {
        QString index = QString::number(i);
        NJson scene = mConfigScene.getObject(index);
        QStringList row;
        NUtil::expand(row, ui->sceneConfigTreeWidget->columnCount());
        row[SCENE_COL_ID] = scene.getStr("id");
        row[SCENE_COL_CLASS] = scene.getStr("class");
        row[SCENE_COL_CLASS_FILE] = scene.getStr("classFile");
        row[SCENE_COL_LAYOUT] = scene.getStr("extra.contentLayoutFile");
        row[SCENE_COL_PAGE] = scene.getStr("extra.page");
        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        items.append(item);
    }

    ui->sceneConfigTreeWidget->addTopLevelItems(items);
}

void NConfigSceneWidget::syncSceneToForm(const QString &sceneId) {
    mCurrentIndex = searchScene(sceneId);
    QString index = QString::number(mCurrentIndex);
    NJson scene = mConfigScene.getObject(index);

    ui->idEdit->setText(scene.getStr("id"));
    ui->classEdit->setText(scene.getStr("class"));
    ui->classFileEdit->setText(scene.getStr("classFile"));
    ui->backgroundColorEdit->setText(scene.getStr("backgroundColor"));
    ui->pageEdit->setText(scene.getStr("extra.page"));
    ui->layoutEdit->setText(scene.getStr("extra.contentLayoutFile"));
}

void NConfigSceneWidget::syncTreeItemToForm(QTreeWidgetItem *item) {
    // 何も選択されなくなった時はNULLが渡ってくる
    if (item == NULL) {
        return;
    }

    QString sceneId = item->text(SCENE_COL_ID);
    syncSceneToForm(sceneId);
}

void NConfigSceneWidget::syncFormToJson() {
    // id check
    QString sceneId = ui->idEdit->text();
    int sceneIndex = searchScene(sceneId);
    int sceneCount = countScene(sceneId);
    if (sceneCount == 0) {
        // pass
    }
    else if (sceneIndex == mCurrentIndex && sceneCount == 1) {
        // pass
    } else {
        QMessageBox::critical(this, tr("exist scene id"), tr("exist scene id"));
        return;
    }

    // class check
    QString class_ = ui->classEdit->text();
    if (class_.isEmpty()) {
        return;
    }

    // class file check.
    QString classFile = ui->classFileEdit->text();
    QFileInfo classFileInfo(mProjectDir.absoluteFilePath(classFile));
    if (!classFileInfo.exists()) {
        int ret = QMessageBox::question(NULL, tr("create class file."), tr("do you create class file?"));
        if (ret != QMessageBox::Yes) {
            return;
        }

        QString path = mProjectDir.absoluteFilePath(classFile);
        QMap<QString, QString> replace;
        replace["{{class}}"] = class_;
        if (!NUtil::createFileFromTemplate(":/template_code/scene.js", path, replace)) {
            return;
        }
    }

    // layout check
    QString layoutFile = ui->layoutEdit->text();
    QFileInfo layoutFileInfo(mProjectDir.absoluteFilePath(layoutFile));
    if (!layoutFileInfo.exists()) {
        int ret = QMessageBox::question(NULL, tr("create layout file."), tr("do you create layout file?"));
        if (ret != QMessageBox::Yes) {
            return;
        }

        QString path = mProjectDir.absoluteFilePath(layoutFile);
        if (!NUtil::createFileFromTemplate(":/template_code/layout.json", path)) {
            return;
        }
    }

    // page check
    QString pageId = ui->pageEdit->text();
    bool existPage = false;
    NJson pageJson;
    pageJson.parseFromFilePath(mProjectDir.absoluteFilePath("config/page.json"));
    for (int i = 0; i < pageJson.length(); i++) {
        QString index = QString::number(i);
        if (pageJson.getStr(index + ".id") == pageId) {
            existPage = true;
            break;
        }
    }
    if (!existPage) {
        QMessageBox::critical(NULL, tr(""), tr("page is not exist."));
        return;
    }

    QString index = QString::number(mCurrentIndex);
    mConfigScene.set(index + ".id", ui->idEdit->text());
    mConfigScene.set(index + ".class", ui->classEdit->text());
    mConfigScene.set(index + ".classFile", ui->classFileEdit->text());
    mConfigScene.set(index + ".backgroundColor", ui->backgroundColorEdit->text());
    mConfigScene.set(index + ".extra.contentLayoutFile", ui->layoutEdit->text());
    mConfigScene.set(index + ".extra.page", ui->pageEdit->text());

    syncJsonToTree();

    // 編集されたことを伝える
    changed();

    ui->sceneConfigTreeWidget->setDisabled(false);
}

void NConfigSceneWidget::selectScene(const QString &sceneId) {
    QTreeWidget *tree = ui->sceneConfigTreeWidget;

    for (int i = 0; i < tree->topLevelItemCount(); i++) {
        QTreeWidgetItem * item = tree->topLevelItem(i);
        QString id = item->text(SCENE_COL_ID);
        if (id == sceneId) {
            tree->setCurrentItem(item);
        }
    }
}

void NConfigSceneWidget::showRawData() {
    NTextDialog dialog(this);
    dialog.setText(mConfigScene.stringify());
    dialog.exec();
}

void NConfigSceneWidget::newScene() {
    //FIXME: idの重複チェックが必要

    QString index = QString::number(mConfigScene.length());

    mConfigScene.set(index + ".id", "Scene" + index);
    mConfigScene.set(index + ".class", "Scene" + index);
    mConfigScene.set(index + ".classFile", "code/scene" + index + ".js");
    mConfigScene.set(index + ".extra.contentLayoutFile", "layout/scene" + index + ".json");
    mConfigScene.set(index + ".extra.page", "Page");

    syncJsonToTree();
    selectScene("Scene" + index);

    ui->sceneConfigTreeWidget->setDisabled(true);
}

void NConfigSceneWidget::removeScene() {
    QList<QTreeWidgetItem *> selectedItems = ui->sceneConfigTreeWidget->selectedItems();
    if (selectedItems.length() == 0) {
        return;
    }

    QTreeWidgetItem *item = selectedItems[0];

    int ret = QMessageBox::question(NULL, tr(""), tr("do you remove scene?"));

    if (ret == QMessageBox::Yes) {
        int index = searchScene(item->text(SCENE_COL_ID));
        mConfigScene.remove(QString::number(index));
        syncJsonToTree();
    }
}

void NConfigSceneWidget::contextMenu(QPoint /*point*/) {
    QMenu menu(this);
    menu.addAction(tr("&New Scene"), this, SLOT(newScene()));
    menu.addAction(tr("&Remove Scene"), this, SLOT(removeScene()));
    menu.addSeparator();
    menu.addAction(tr("&Raw Data"), this, SLOT(showRawData()));
    menu.exec(QCursor::pos());
}

NConfigSceneWidget::~NConfigSceneWidget()
{
    delete ui;
}
