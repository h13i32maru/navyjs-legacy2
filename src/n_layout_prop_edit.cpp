#include "n_layout_prop_edit.h"
#include "ui_n_layout_prop_edit.h"
#include "util/n_json.h"
#include "util/n_util.h"
#include "n_project.h"
#include <extend/n_completer.h>

#include <QCompleter>
#include <QDebug>
#include <QListView>
#include <QSortFilterProxyModel>

const QString NLayoutPropEdit::ClassView = "Navy.View.View";
const QString NLayoutPropEdit::ClassText = "Navy.View.Text";
const QString NLayoutPropEdit::ClassImage = "Navy.View.Image";
const QString NLayoutPropEdit::ClassViewGroup = "Navy.ViewGroup.ViewGroup";

NLayoutPropEdit::NLayoutPropEdit(QWidget *parent) : QWidget(parent), ui(new Ui::NLayoutPropEdit)
{
    ui->setupUi(this);

    mWidgetSignalBlocked = false;
    mWidgetList = NUtil::recursiveWidgetChildren(ui->scrollArea);

    refreshForActive();

    hideAllExtraPropWidget();

    connectWidgetToJson();
}

void NLayoutPropEdit::refreshForActive() {
    ui->extraSrc->setList(NProject::instance()->images());
    ui->extraContentLayout->setList(NProject::instance()->layouts());
}

void NLayoutPropEdit::setNativeBridge(NativeBridge *native) {
    mNative = native;

    connect(mNative, SIGNAL(currentViewFromJS(NJson)), this, SLOT(setViewFromJS(NJson)));
    connect(mNative, SIGNAL(currentViewPosFromJS(int,int)), this, SLOT(setViewPosFromJS(int,int)));
}

void NLayoutPropEdit::blockAllSignals(bool block) {
    if (block == mWidgetSignalBlocked) {
        return;
    }

    mWidgetSignalBlocked = block;
    int len = mWidgetList.length();
    for (int i = 0; i < len; i++) {
        mWidgetList[i]->blockSignals(block);
    }
}

void NLayoutPropEdit::connectWidgetToJson() {
    connect(ui->visible, SIGNAL(toggled(bool)), this, SLOT(syncWidgetToJson()));
    connect(ui->posXSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->posYSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeWidthSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeHeightSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->backgroundColor, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizePolicy, SIGNAL(currentIndexChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->linkType, SIGNAL(currentIndexChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->linkType, SIGNAL(currentIndexChanged(int)), this, SLOT(setLinkIdList()));
    connect(ui->linkId, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));

    // text
    connect(ui->extraText, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));
    connect(ui->extraFontSize, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));

    // image
    connect(ui->extraSrc, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));

    // view group
    connect(ui->extraContentLayout, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));
}

void NLayoutPropEdit::syncWidgetToJson() {
    mView.set("visible", ui->visible->isChecked());
    mView.set("pos.x", ui->posXSpinBox->value());
    mView.set("pos.y", ui->posYSpinBox->value());
    mView.set("size.width", ui->sizeWidthSpinBox->value());
    mView.set("size.height", ui->sizeHeightSpinBox->value());
    mView.set("backgroundColor", ui->backgroundColor->text());
    mView.set("sizePolicy", ui->sizePolicy->currentText());

    if (ui->linkType->currentIndex() != 0) {
        mView.set("link.type", ui->linkType->currentText());
        mView.set("link.id", ui->linkId->currentText());
    } else {
        mView.remove("link");
    }

    QString className = mView.getStr("class");
    if (className == ClassView) {
       // nothing
    } else if (className == ClassText){
        mView.set("extra.text", ui->extraText->text());
        mView.set("extra.fontSize", ui->extraFontSize->value());
    } else if (className == ClassImage) {
        mView.set("extra.src", ui->extraSrc->currentText());
    } else if (className == ClassViewGroup) {
        mView.set("extra.contentLayoutFile", ui->extraContentLayout->currentText());
    }

    emit mNative->changedViewPropertyToJS(mView.toVariant());
}

void NLayoutPropEdit::hideAllExtraPropWidget() {
    ui->imageViewWidget->hide();
    ui->textViewWidget->hide();
    ui->viewGroupWidget->hide();
}

void NLayoutPropEdit::showExtraPropWidget(QString className) {
    if (className == ClassView) {
        return;
    } else if (className == ClassImage) {
        ui->imageViewWidget->show();
    } else if (className == ClassText) {
        ui->textViewWidget->show();
    } else if (className == ClassViewGroup) {
        ui->viewGroupWidget->show();
    }
}

void NLayoutPropEdit::setViewFromJS(const NJson &views) {
    blockAllSignals(true);

    // 複数のviewが選択されている場合があるので、最後に選択されたものを対象とする
    QString last = QString::number(views.length() - 1);
    NJson view = views.getObject(last);

    mView = view;
    ui->idLabel->setText(view.getStr("id"));
    ui->classLabel->setText(view.getStr("class"));
    ui->visible->setChecked(view.getBool("visible"));
    ui->posXSpinBox->setValue(view.getInt("pos.x"));
    ui->posYSpinBox->setValue(view.getInt("pos.y"));
    ui->sizeWidthSpinBox->setValue(view.getInt("size.width"));
    ui->sizeHeightSpinBox->setValue(view.getInt("size.height"));
    ui->backgroundColor->setText(view.getStr("backgroundColor"));
    ui->sizePolicy->setCurrentText(view.getStr("sizePolicy"));

    ui->linkType->setCurrentIndex(0);
    ui->linkType->setCurrentText(view.getStr("link.type"));
    ui->linkId->setCurrentText(view.getStr("link.id"));


    QString className = view.getStr("class");
    if (className == ClassView) {
       // nothing
    } else if (className == ClassText){
        ui->extraText->setText(view.getStr("extra.text"));
        ui->extraFontSize->setValue(view.getInt("extra.fontSize"));
    } else if (className == ClassImage) {
        ui->extraSrc->setCurrentText(view.getStr("extra.src"));
    } else if (className == ClassViewGroup) {
        ui->extraContentLayout->setCurrentText(view.getStr("extra.contentLayoutFile"));
    }




    hideAllExtraPropWidget();
    showExtraPropWidget(view.getStr("class"));

    blockAllSignals(false);
}

void NLayoutPropEdit::setViewPosFromJS(const int &x, const int &y) {
    blockAllSignals(true);

    ui->posXSpinBox->setValue(x);
    ui->posYSpinBox->setValue(y);

    blockAllSignals(false);
}

void NLayoutPropEdit::setLinkIdList() {
    QString type = ui->linkType->currentText();
    if (type == "page") {
        ui->linkId->setList(NProject::instance()->pages());
    } else if(type == "scene") {
        ui->linkId->setList(NProject::instance()->scenes());
    }
}

NLayoutPropEdit::~NLayoutPropEdit()
{
    delete ui;
}
