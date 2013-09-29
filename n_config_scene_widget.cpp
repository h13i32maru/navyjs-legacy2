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
        item->setFlags(item->flags() | Qt::ItemIsEditable);
        items.append(item);
    }

    ui->sceneConfigTreeWidget->addTopLevelItems(items);
}

void NConfigSceneWidget::syncTreeItemToForm(QTreeWidgetItem *item) {
    // 何も選択されなくなった時はNULLが渡ってくる
    if (item == NULL) {
        return;
    }

    QString sceneId = item->text(SCENE_COL_ID);

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

void NConfigSceneWidget::syncFormToJson() {
    QString index = QString::number(mCurrentIndex);

    mConfigScene.set(index + ".id", ui->idEdit->text());
    mConfigScene.set(index + ".class", ui->classEdit->text());
    mConfigScene.set(index + ".classFile", ui->classFileEdit->text());
    mConfigScene.set(index + ".backgroundColor", ui->backgroundColorEdit->text());
    mConfigScene.set(index + ".extra.contentLayoutFile", ui->layoutEdit->text());
    mConfigScene.set(index + ".extra.page", ui->pageEdit->text());

    syncJsonToTree();
}

void NConfigSceneWidget::showRawData() {
    NTextDialog dialog(this);
    dialog.setText(mConfigScene.stringify());
    dialog.exec();
}

void NConfigSceneWidget::newScene() {
    int count = ui->sceneConfigTreeWidget->topLevelItemCount();
    QString suffix = QString::number(count);
    QStringList row;
    NUtil::expand(row, ui->sceneConfigTreeWidget->columnCount());
    row[SCENE_COL_ID] = "Scene" + suffix;
    row[SCENE_COL_CLASS] = "Scene" + suffix;
    row[SCENE_COL_CLASS_FILE] = "code/scene" + suffix + ".js";
    row[SCENE_COL_LAYOUT] = "layout/scene" + suffix + ".json";
    row[SCENE_COL_PAGE] = "Page";
    QTreeWidgetItem *item = new QTreeWidgetItem(row);
    item->setFlags(item->flags() | Qt::ItemIsEditable);
    ui->sceneConfigTreeWidget->insertTopLevelItem(count, item);
}

void NConfigSceneWidget::removeScene() {
    QList<QTreeWidgetItem *> selectedItems = ui->sceneConfigTreeWidget->selectedItems();
    if (selectedItems.length() == 0) {
        return;
    }

    QTreeWidgetItem *item = selectedItems[0];

    QMessageBox msgBox;
    msgBox.setText(tr("Do you remove scene?"));
    msgBox.setInformativeText(item->text(SCENE_COL_ID));
    msgBox.setStandardButtons(QMessageBox::Ok | QMessageBox::Cancel);
    msgBox.setDefaultButton(QMessageBox::Cancel);
    int ret = msgBox.exec();
    if (ret == QMessageBox::Ok) {
        ui->sceneConfigTreeWidget->takeTopLevelItem(ui->sceneConfigTreeWidget->indexOfTopLevelItem(item));
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
